# request-authorization

[![build status](https://travis-ci.org/croweman/request-authorization.svg)](https://travis-ci.org/croweman/request-authorization) [![npm version](https://badge.fury.io/js/request-authorization.svg)](https://www.npmjs.com/package/request-authorization)


Node module for signing and authorizing requests.

## Usage

Firstly the module will need to be initialized with schemes and there associated clients.  This only needs to be done once preferably on application start.

More schemes are defined below in the scheme options section.

```js

var requestAuthorization = require('request-authorization');

var schemes = [
    {
        scheme: 'HMAC-SHA256',
        alias: 'scheme-one', // NOT REQUIRED
        useTimestamp: true,
        clients: [
            {
                clientId: 'clientOne',
                password: 'aGVsbG93b3JsZA==' // base64 encoded password
            }
        ]
    },
    {
        scheme: 'RSA',
        useTimestamp: true,
        timestampValidationWindowInSeconds: 60,
        clients: [
            {
                clientId: 'clientTwo',
                relativeOrAbsolutePathToPublicKey: './public.pem',
                relativeOrAbsolutePathToPrivateKey: './private.key'
            }
        ]
    }
];

requestAuthorization.init(schemes);

```

## Generate authororization header

The generateAuthorizationHeader function can be used to generate authorization headers.  The function accepts an options argument and data as a string to be used for the signature.

```js
var requestAuthorization = require('request-authorization');

var options = {
    schemeName: 'HMAC-SHA256',
    clientId: 'clientOne'
};

var data = req.originalUrl + (req.body ? JSON.stringify(req.body) : '{}');
var header = requestAuthorization.generateAuthorizationHeader(options, data);
```

The generated authorization header would look like the following:

```js
HMAC-SHA256 clientId=clientOne;timestamp=2015-11-11T13:41:09.430Z;signature=cCqTvX6CZDv1N00QUP1lsvzSO6SFawQHz1bTHCeBnyA=
```

If an alias was defined for the scheme then the alias name would be used instead of the scheme name in the generated header.

```js
Custom-Alias-Name clientId=clientOne;timestamp=2015-11-11T13:41:09.430Z;signature=cCqTvX6CZDv1N00QUP1lsvzSO6SFawQHz1bTHCeBnyA=
``````

## isAuthorized

The isAuthorized function can be used to authorize a request.  The function accepts the 'authorization' header and request data as a string.

```js
var requestAuthorization = require('request-authorization');

var data = "{ firstName: 'john' }";
var authorizationHeader = 'HMAC-SHA256 clientId=clientOne;timestamp=2015-11-05T12:12:35.675Z;signature=8+OIZQiZBqdBx5CGzVyMMfNhXPbhz2szJX2WqWrun5U=';

var authorized = requestAuthorization.isAuthorized(authorizationHeader, data);

console.log('authorization scheme name:', authorized.schemeName);
console.log('authorization client id:', authorized.clientId);

if (authorized.result) {
    console.log('You are allowed in');
}
else {
    console.log('Denied');
    console.log('authorization error', authorized.error);
}
```
## authorization

Express authorization middleware is available and can be used in the following way.

```js
var requestAuthorization = require('request-authorization');
var express = require('express');
var router = express.Router();

router.get('/', requestAuthorization.authorized(getData), function(req, res) {
	res.status(200).send('You got in');

	console.log(req.requestAuthorizationIsAuthorizedResult.schemeName);
	console.log(req.requestAuthorizationIsAuthorizedResult.clientId);
	console.log(req.requestAuthorizationIsAuthorizedResult.result);
	console.log(req.requestAuthorizationIsAuthorizedResult.error);
});

function getData(req) {
    return req.originalUrl + (req.body ? JSON.stringify(req.body) : '{}');
}

// a route could also be used that does not make use of a get data function
router.get('/', requestAuthorization.authorized(), function(req, res) {
	res.status(200).send('You got in');
});
```

## Scheme options

When initialising the module multiple schemes can be provided, each scheme can also have multiple clients each having different names, base64 encoded passwords, public and private keys for  signature generation.

The schemes currently available are:

- HMAC-SHA256
- HMAC-SHA512
- HMAC-MD5
- RSA

## alias

If an alias is defined this will be used in the first part of the header.

```js
var headerExample = 'aliasName clientId=clientOne;timestamp=2015-11-11T13:41:09.430Z;signature=cCqTvX6CZDv1N00QUP1lsvzSO6SFawQHz1bTHCeBnyA='
```

### useTimestamp

If the userTimestamp option is defined and set to true the iso string date format will be used in the signature and header.

```js
var headerExample = 'HMAC-SHA256 clientId=clientOne;timestamp=2015-11-11T13:41:09.430Z;signature=cCqTvX6CZDv1N00QUP1lsvzSO6SFawQHz1bTHCeBnyA='

var isoFormatDate = new Date().toISOString();
```

### timestampValidationWindowInSeconds

If useTimestamp is defined and the timestampValidationWindowInSeconds is defined then the difference between the timestamp and the server dateTime will be checked and if it is outside of the configured window the request would not be authorized.

```js
var requestAuthorization = require('request-authorization');

var schemes = [
    {
        scheme: 'HMAC-SHA256',
        alias: 'Alias-Name', // NOT REQUIRED
        useTimestamp: true,
        timestampValidationWindowInSeconds: 60,
        clients: [
            {
                clientId: 'clientOne',
                password: 'aGVsbG93b3JsZA==' // base64 encoded password
            }
        ]
    }
];

requestAuthorization.init(schemes);
```

## Installation

With [npm](http://npmjs.org) do

```bash
$ npm install request-authorization --save
```

## License

(MIT)

Copyright (c) 2015 Lee Crowe

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
