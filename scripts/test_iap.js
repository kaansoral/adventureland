var secret="ac2b8964dffd4a8a961f427d1257d8f7";
var f=require(process.env.HOME+"/thegeobird/scripts/functions.js");
var iap = require('in-app-purchase');
var receipt_file="/Applications/Adventure Land.app/Contents/_MASReceipt/receipt";
//var receipt_file="/Users/kaan/Downloads/receipt";
var receipt_file="/Users/kaan/Downloads/receipt2";
iap.config({
	appleExcludeOldTransactions: false,
	applePassword:secret,
});
// console.log(f.read_file(receipt_file));
// console.log(require("fs").readFileSync(receipt_file));
console.log(require("fs").readFileSync(receipt_file).toString("base64"));
iap.setup().then(() => {
	// iap.validate(...) automatically detects what type of receipt you are trying to validate
	iap.validate(require("fs").readFileSync(receipt_file).toString("base64")).then(onSuccess).catch(onError);
})
.catch((error) => {
	console.log("error");
});

function onSuccess(validatedData) {
	// validatedData: the actual content of the validated receipt
	// validatedData also contains the original receipt
	var options = {
			ignoreCanceled: true, // Apple ONLY (for now...): purchaseData will NOT contain cancceled items
			ignoreExpired: true // purchaseData will NOT contain exipired subscription items
	};
	// validatedData contains sandbox: true/false for Apple and Amazon
	console.log("Validated: "+JSON.stringify(validatedData));
	var purchaseData = iap.getPurchaseData(validatedData, options);
	console.log("purchaseData: "+JSON.stringify(purchaseData));
}

function onError(error) {
	console.log("Error: "+JSON.stringify(error));
}