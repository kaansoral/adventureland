import httplib
import urllib
import hashlib
import hmac
import logging
import base64
from datetime import datetime
from xml.etree.ElementTree import XML

def encodeUnicodez(args):
    if args and type(args)==type({}):
        for key,value in args.items():
            if type(value)==type(u""):
                args[key]=value.encode("utf-8")

log = logging.getLogger(__name__)

class AmazonSES:
	def __init__(self, accessKeyID, secretAccessKey):
		self._accessKeyID = accessKeyID
		self._secretAccessKey = secretAccessKey
		self._responseParser = AmazonResponseParser()

	def _getSignature(self, dateValue):
		h = hmac.new(key=self._secretAccessKey, msg=dateValue, digestmod=hashlib.sha256)
		return base64.b64encode(h.digest()).decode()

	def _getHeaders(self,oparams,params):
		#headers = { 'Content-type': 'application/x-www-form-urlencoded' }
		#d = datetime.utcnow()
		#dateValue = d.strftime('%a, %d %b %Y %H:%M:%S GMT')
		#headers['Date'] = dateValue
		#signature = self._getSignature(dateValue)
		#headers['X-Amzn-Authorization'] = 'AWS3-HTTPS AWSAccessKeyId=%s, Algorithm=HMACSHA256, Signature=%s' % (self._accessKeyID, signature)

		def sign(key, msg):
		    return hmac.new(key, msg.encode('utf-8'), hashlib.sha256).digest()

		def getSignatureKey(key, dateStamp, regionName, serviceName):
		    kDate = sign(('AWS4' + key).encode('utf-8'), dateStamp)
		    kRegion = sign(kDate, regionName)
		    kService = sign(kRegion, serviceName)
		    kSigning = sign(kService, 'aws4_request')
		    return kSigning

		# Read AWS access key from env. variables or configuration file. Best practice is NOT
		# to embed credentials in code.
		access_key = self._accessKeyID
		secret_key = self._secretAccessKey

		# Create a date for headers and the credential string
		t = datetime.utcnow()
		amzdate = t.strftime('%Y%m%dT%H%M%SZ')
		datestamp = t.strftime('%Y%m%d') # Date w/o time, used in credential scope


		# ************* TASK 1: CREATE A CANONICAL REQUEST *************
		# http://docs.aws.amazon.com/general/latest/gr/sigv4-create-canonical-request.html

		# Step 1 is to define the verb (GET, POST, etc.)--already done.

		# Step 2: Create canonical URI--the part of the URI from domain to query 
		# string (use '/' if no path)
		content_type='application/x-www-form-urlencoded'
		service = 'ec2'; service='email'
		host = 'email.us-east-1.amazonaws.com'
		region = 'us-east-1'
		endpoint = 'https://email.us-east-1.amazonaws.com'
		canonical_uri = '/' 
		method='POST'

		# Step 3: Create the canonical query string. In this example (a GET request),
		# request parameters are in the query string. Query string values must
		# be URL-encoded (space=%20). The parameters must be sorted by name.
		# For this example, the query string is pre-formatted in the request_parameters variable.
		#canonical_querystring = request_parameters = 'Action=%s'%oparams['Action']
		canonical_querystring=params
		canonical_querystring=''

		# Step 4: Create the canonical headers and signed headers. Header names
		# must be trimmed and lowercase, and sorted in code point order from
		# low to high. Note that there is a trailing \n.
		canonical_headers = 'host:' + host + '\n' + 'x-amz-date:' + amzdate + '\n'

		# Step 5: Create the list of signed headers. This lists the headers
		# in the canonical_headers list, delimited with ";" and in alpha order.
		# Note: The request can include any headers; canonical_headers and
		# signed_headers lists those that you want to be included in the 
		# hash of the request. "Host" and "x-amz-date" are always required.
		signed_headers = 'host;x-amz-date'

		# Step 6: Create payload hash (hash of the request body content). For GET
		# requests, the payload is an empty string ("").
		payload_hash = hashlib.sha256((params).encode('utf-8')).hexdigest()

		# Step 7: Combine elements to create canonical request
		canonical_request = method + '\n' + canonical_uri + '\n' + canonical_querystring + '\n' + canonical_headers + '\n' + signed_headers + '\n' + payload_hash


		# ************* TASK 2: CREATE THE STRING TO SIGN*************
		# Match the algorithm to the hashing algorithm you use, either SHA-1 or
		# SHA-256 (recommended)
		algorithm = 'AWS4-HMAC-SHA256'
		credential_scope = datestamp + '/' + region + '/' + service + '/' + 'aws4_request'
		string_to_sign = algorithm + '\n' +  amzdate + '\n' +  credential_scope + '\n' +  hashlib.sha256(canonical_request.encode('utf-8')).hexdigest()
		logging.info(string_to_sign)

		# ************* TASK 3: CALCULATE THE SIGNATURE *************
		# Create the signing key using the function defined above.
		signing_key = getSignatureKey(secret_key, datestamp, region, service)

		# Sign the string_to_sign using the signing_key
		signature = hmac.new(signing_key, (string_to_sign).encode('utf-8'), hashlib.sha256).hexdigest()

		authorization_header = algorithm + ' ' + 'Credential=' + access_key + '/' + credential_scope + ', ' +  'SignedHeaders=' + signed_headers + ', ' + 'Signature=' + signature
		headers = {'Content-Type':content_type,
		#'X-Amz-Algorithm':'AWS4-HMAC-SHA256',
           'X-Amz-Date':amzdate,
           'Authorization':authorization_header}
		return headers

	def _performAction(self, actionName, params=None):
		if not params:
			params = {}
		params['Action'] = actionName
		oparams=params
		#https://email.us-east-1.amazonaws.com/
		conn = httplib.HTTPSConnection('email.us-east-1.amazonaws.com')
		encodeUnicodez(params)
		params = urllib.urlencode(params)
		conn.request('POST', '/', params, self._getHeaders(oparams,params))
		response = conn.getresponse()
		responseResult = response.read()
		conn.close()
		return self._responseParser.parse(actionName, response.status, response.reason, responseResult)

	def verifyEmailAddress(self, emailAddress):
		params = { 'EmailAddress': emailAddress }
		return self._performAction('VerifyEmailAddress', params)

	def deleteVerifiedEmailAddress(self, emailAddress):
		params = { 'EmailAddress': emailAddress }
		return self._performAction('DeleteVerifiedEmailAddress', params)

	def getSendQuota(self):
		return self._performAction('GetSendQuota')

	def getSendStatistics(self):
		return self._performAction('GetSendStatistics')

	def listVerifiedEmailAddresses(self):
		return self._performAction('ListVerifiedEmailAddresses')

	def sendEmail(self, source, toAddresses, message, replyToAddresses=None, returnPath=None, ccAddresses=None, bccAddresses=None):
		params = { 'Source': source }
		for objName, addresses in zip(["ToAddresses", "CcAddresses", "BccAddresses"], [toAddresses, ccAddresses, bccAddresses]):
			if addresses:
				if not isinstance(addresses, basestring) and getattr(addresses, '__iter__', False):
					for i, address in enumerate(addresses, 1):
						params['Destination.%s.member.%d' % (objName, i)] = address
				else:
					params['Destination.%s.member.1' % objName] = addresses
		if not returnPath:
			returnPath = source
		params['ReturnPath'] = returnPath
		params['Message.Subject.Charset'] = message.charset
		params['Message.Subject.Data'] = message.subject
		if message.bodyText:
			params['Message.Body.Text.Charset'] = message.charset
			params['Message.Body.Text.Data'] = message.bodyText
		if message.bodyHtml:
			params['Message.Body.Html.Charset'] = message.charset
			params['Message.Body.Html.Data'] = message.bodyHtml
		return self._performAction('SendEmail', params)



class EmailMessage:
	def __init__(self):
		self.charset = 'UTF-8'
		self.subject = None
		self.bodyHtml = None
		self.bodyText = None



class AmazonError(Exception):
	def __init__(self, errorType, code, message):
		self.errorType = errorType
		self.code = code
		self.message = message
		logging.info(message)

class AmazonAPIError(Exception):
	def __init__(self, message):
		self.message = message



class AmazonResult:
	def __init__(self, requestId):
		self.requestId = requestId

class AmazonSendEmailResult(AmazonResult):
	def __init__(self, requestId, messageId):
		self.requestId = requestId
		self.messageId = messageId

class AmazonSendQuota(AmazonResult):
	def __init__(self, requestId, max24HourSend, maxSendRate, sentLast24Hours):
		self.requestId = requestId
		self.max24HourSend = max24HourSend
		self.maxSendRate = maxSendRate
		self.sentLast24Hours = sentLast24Hours

class AmazonSendDataPoint:
	def __init__(self, bounces, complaints, deliveryAttempts, rejects, timestamp):
		self.bounces = bounces
		self.complaints = complaints
		self.deliveryAttempts = deliveryAttempts
		self.rejects = rejects
		self.timestamp = timestamp

class AmazonSendStatistics(AmazonResult):
	def __init__(self, requestId):
		self.requestId = requestId
		self.members = []

class AmazonVerifiedEmails(AmazonSendStatistics):
	pass

class AmazonResponseParser:
	class XmlResponse:
		def __init__(self, str):
			self._rootElement = XML(str)
			self._namespace = self._rootElement.tag[1:].split("}")[0]

		def checkResponseName(self, name):
			if self._rootElement.tag == self._fixTag(self._namespace, name):
				return True
			else:
				raise AmazonAPIError('ErrorResponse is invalid.')

		def checkActionName(self, actionName):
			if self._rootElement.tag == self._fixTag(self._namespace, ('%sResponse' % actionName)):
				return True
			else:
				raise AmazonAPIError('Response of action "%s" is invalid.' % actionName)

		def getChild(self, *itemPath):
			node = self._findNode(self._rootElement, self._namespace, *itemPath)
			if node != None:
				return node
			else:
				raise AmazonAPIError('Node with the specified path was not found.')

		def getChildText(self, *itemPath):
			node = self.getChild(*itemPath)
			return node.text

		def _fixTag(self, namespace, tag):
			return '{%s}%s' % (namespace, tag)

		def _findNode(self, rootElement, namespace, *args):
			match = '.'
			for s in args:
				match += '/{%s}%s' % (namespace, s)
			return rootElement.find(match)


	def __init__(self):
		self._simpleResultActions = ['DeleteVerifiedEmailAddress', 'VerifyEmailAddress']

	def _parseSimpleResult(self, actionName, xmlResponse):
		if xmlResponse.checkActionName(actionName):
			requestId = xmlResponse.getChildText('ResponseMetadata', 'RequestId')
			return AmazonResult(requestId)

	def _parseSendQuota(self, actionName, xmlResponse):
		if xmlResponse.checkActionName(actionName):
			requestId = xmlResponse.getChildText('ResponseMetadata', 'RequestId')
			value = xmlResponse.getChildText('GetSendQuotaResult', 'Max24HourSend')
			max24HourSend = float(value)
			value = xmlResponse.getChildText('GetSendQuotaResult', 'MaxSendRate')
			maxSendRate = float(value)
			value = xmlResponse.getChildText('GetSendQuotaResult', 'SentLast24Hours')
			sentLast24Hours = float(value)
			return AmazonSendQuota(requestId, max24HourSend, maxSendRate, sentLast24Hours)

	#def _parseSendStatistics(self, actionName, xmlResponse):
	# if xmlResponse.checkActionName(actionName):
	# requestId = xmlResponse.getChildText('ResponseMetadata', 'RequestId')

	def _parseListVerifiedEmails(self, actionName, xmlResponse):
		if xmlResponse.checkActionName(actionName):
			requestId = xmlResponse.getChildText('ResponseMetadata', 'RequestId')
			node = xmlResponse.getChild('ListVerifiedEmailAddressesResult', 'VerifiedEmailAddresses')
			result = AmazonVerifiedEmails(requestId)
			for addr in node:
				result.members.append(addr.text)
			return result

	def _parseSendEmail(self, actionName, xmlResponse):
		if xmlResponse.checkActionName(actionName):
			requestId = xmlResponse.getChildText('ResponseMetadata', 'RequestId')
			messageId = xmlResponse.getChildText('SendEmailResult', 'MessageId')
			return AmazonSendEmailResult(requestId, messageId)

	def _raiseError(self, xmlResponse):
		if xmlResponse.checkResponseName('ErrorResponse'):
			errorType = xmlResponse.getChildText('Error', 'Type')
			code = xmlResponse.getChildText('Error', 'Code')
			message = xmlResponse.getChildText('Error', 'Message')
			raise AmazonError(errorType, code, message)

	def parse(self, actionName, statusCode, reason, responseResult):
		xmlResponse = self.XmlResponse(responseResult)
		log.info('Response status code: %s, reason: %s', statusCode, reason)
		log.debug(responseResult)

		result = None
		if statusCode != 200:
			self._raiseError(xmlResponse)
		else:
			if actionName in self._simpleResultActions:
				result = self._parseSimpleResult(actionName, xmlResponse)
			elif actionName in ['SendEmail']:
				result = self._parseSendEmail(actionName, xmlResponse)
			elif actionName == 'GetSendQuota':
				result = self._parseSendQuota(actionName, xmlResponse)
			#elif actionName == 'GetSendStatistics':
			# result = self._parseSendStatistics(actionName, xmlResponse)
			elif actionName == 'ListVerifiedEmailAddresses':
				result = self._parseListVerifiedEmails(actionName, xmlResponse)
			else:
				raise AmazonAPIError('Action %s is not supported. Please contact: vladimir@tagmask.com' % (actionName,))
		return result

