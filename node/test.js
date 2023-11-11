var crypto = require("crypto");
var protobuf = require("protobufjs");
var ByteBuffer = require("bytebuffer");

function symmetricDecrypt(input, key, checkHmac) {
	var aesIv = crypto.createDecipheriv("aes-256-ecb", key, "");
	aesIv.setAutoPadding(false);
	aesIv.end(input.slice(0, 16));
	var iv = aesIv.read();

	var aesData = crypto.createDecipheriv("aes-256-cbc", key, iv);
	aesData.end(input.slice(16));
	var plaintext = aesData.read();

	if (checkHmac) {
		// The last 3 bytes of the IV are a random value, and the remainder are a partial HMAC
		var remotePartialHmac = iv.slice(0, iv.length - 3);
		var random = iv.slice(iv.length - 3, iv.length);
		var hmac = crypto.createHmac("sha1", key.slice(0, 16));
		hmac.update(random);
		hmac.update(plaintext);
		if (!remotePartialHmac.equals(hmac.digest().slice(0, remotePartialHmac.length))) {
			throw new Error("Received invalid HMAC from remote host.");
		}
	}

	return plaintext;
}

function parseAppTicket(ticket) {
	// https://github.com/SteamRE/SteamKit/blob/master/Resources/Structs/steam3_appticket.hsl

	console.log(ticket);
	if (!ByteBuffer.isByteBuffer(ticket)) {
		ticket = ByteBuffer.wrap(ticket, ByteBuffer.LITTLE_ENDIAN);
	}

	let details = {};

	try {
		let initialLength = ticket.readUint32();
		console.log(initialLength);
		if (initialLength == 20) {
			// This is a full appticket, with a GC token and session header (in addition to ownership ticket)
			details.authTicket = ticket.slice(ticket.offset - 4, ticket.offset - 4 + 52).toBuffer(); // this is the part that's passed back to Steam for validation

			details.gcToken = ticket.readUint64().toString();
			//details.steamID = new SteamID(ticket.readUint64().toString());
			ticket.skip(8); // the SteamID gets read later on
			details.tokenGenerated = new Date(ticket.readUint32() * 1000);

			if (ticket.readUint32() != 24) {
				// SESSIONHEADER should be 24 bytes.
				return null;
			}

			ticket.skip(8); // unknown 1 and unknown 2
			details.sessionExternalIP = Helpers.ipIntToString(ticket.readUint32());
			ticket.skip(4); // filler
			details.clientConnectionTime = ticket.readUint32(); // time the client has been connected to Steam in ms
			details.clientConnectionCount = ticket.readUint32(); // how many servers the client has connected to

			if (ticket.readUint32() + ticket.offset != ticket.limit) {
				// OWNERSHIPSECTIONWITHSIGNATURE sectlength
				return null;
			}
		} else {
			ticket.skip(-4);
		}

		// Start reading the ownership ticket
		let ownershipTicketOffset = ticket.offset;
		let ownershipTicketLength = ticket.readUint32(); // including itself, for some reason
		if (
			ownershipTicketOffset + ownershipTicketLength != ticket.limit &&
			ownershipTicketOffset + ownershipTicketLength + 128 != ticket.limit
		) {
			return null;
		}

		let i;
		let j;
		let dlc;

		details.version = ticket.readUint32();
		details.steamID = ticket.readUint64().toString();
		details.appID = ticket.readUint32();
		details.ownershipTicketExternalIP = ticket.readUint32();
		details.ownershipTicketInternalIP = ticket.readUint32(); // Helpers.ipIntToString(
		details.ownershipFlags = ticket.readUint32();
		details.ownershipTicketGenerated = new Date(ticket.readUint32() * 1000);
		details.ownershipTicketExpires = new Date(ticket.readUint32() * 1000);
		details.licenses = [];
		// return details;

		let licenseCount = ticket.readUint16();
		for (i = 0; i < licenseCount; i++) {
			details.licenses.push(ticket.readUint32());
		}

		details.dlc = [];

		let dlcCount = ticket.readUint16();
		for (i = 0; i < dlcCount; i++) {
			dlc = {};
			dlc.appID = ticket.readUint32();
			dlc.licenses = [];

			licenseCount = ticket.readUint16();

			for (j = 0; j < licenseCount; j++) {
				dlc.licenses.push(ticket.readUint32());
			}

			details.dlc.push(dlc);
		}

		ticket.readUint16(); // reserved
		if (ticket.offset + 128 == ticket.limit) {
			// Has signature
			details.signature = ticket.slice(ticket.offset, ticket.offset + 128).toBuffer();
		}

		let date = new Date();
		details.isExpired = details.ownershipTicketExpires < date;
		details.hasValidSignature =
			!!details.signature &&
			SteamCrypto.verifySignature(
				ticket.slice(ownershipTicketOffset, ownershipTicketOffset + ownershipTicketLength).toBuffer(),
				details.signature,
			);
		details.isValid = !details.isExpired && (!details.signature || details.hasValidSignature);
	} catch (ex) {
		console.log("parseAppTicket: " + ex);
		return details;
		return null; // not a valid ticket
	}

	return details;
}

var proto = {
	nested: {
		EncryptedAppTicket: {
			fields: {
				ticketVersionNo: { type: "uint32", id: 1 },
				crcEncryptedticket: { type: "uint32", id: 2 },
				cbEncrypteduserdata: { type: "uint32", id: 3 },
				cbEncryptedAppownershipticket: { type: "uint32", id: 4 },
				encryptedTicket: { type: "bytes", id: 5 },
			},
		},
	},
};
var proto_root = protobuf.Root.fromJSON(proto);
var EncryptedAppTicket = proto_root.lookupType("EncryptedAppTicket");

var outer = EncryptedAppTicket.decode(
	new Buffer(
		"080110a7e59890031815204f2a80014527ad8cccd8cd9b7d3260529556004ddf0454a1c2e8543495b1eb72b3dff44d9d67555798ef44b7e3f97cf86d3bf1bc3f84a91de415c382b0d96033c8e5398f2b775bcb004f5487c651d81ef410d7d2917cbb407713397d2c29a455b6852eac7db1a0e52248585bd5440ef07de54b7519f67eefbad5420d97b77ef7e35450af",
		"hex",
	),
);
var decrypted = symmetricDecrypt(
	outer.encryptedTicket,
	new Buffer("8af5c487af6c7709ef1a4e6e2275fcc0a90f57ae4319de793fca3d7ed8655520", "hex"),
);
let userData = decrypted.slice(0, outer.cbEncrypteduserdata);
let ownershipTicketLength = decrypted.readUInt32LE(outer.cbEncrypteduserdata);
let ownershipTicket = parseAppTicket(
	decrypted.slice(outer.cbEncrypteduserdata, outer.cbEncrypteduserdata + ownershipTicketLength),
);
if (ownershipTicket) {
	ownershipTicket.userData = userData.toString();
}
console.log(ownershipTicket);
