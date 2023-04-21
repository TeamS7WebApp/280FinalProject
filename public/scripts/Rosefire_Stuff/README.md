# Rosefire Javascript SDK

![Javascript](https://img.shields.io/badge/javascript-v2.1.1-orange.svg)

## Setup 

This project can be downloaded via npm by typing in the following command. Alternatively, you can just download the zip
of this repo and grab the file you need.
```
npm install git+https://ada.csse.rose-hulman.edu/rosefire/javascript-sdk.git#2.1.1 --save
```

## Plain Javascript SDK

If you using plain javascript, or creating your own binding into some framework, you'll
want to use these instructions. If you're using angular, see below.

**Step 1:** Load the module

Make sure you include this script in the dist folder of the module in your html page.
```html
<script src="node_modules/rosefire/dist/js/rosefire.min.js"></script>
```

### Usage with Firebase

**Step 2:** You're all ready to authenticate if you use [Firebase's plain javascript SDK](https://www.firebase.com/docs/web/api/).

```javascript
// Please note this needs to be the result of a user interaction
// (like a button click) otherwise it will get blocked as a popup
Rosefire.signIn("<REGISTRY_TOKEN>", (err, rfUser) => {
  if (err) {
    console.log("Rosefire error!", err);
    return;
  }
  console.log("Rosefire success!", rfUser);

  // Next use the Rosefire token with Firebase auth.
  firebase.auth().signInWithCustomToken(rfUser.token).catch((error) => {
    if (error.code === 'auth/invalid-custom-token') {
      console.log("The token you provided is not valid.");
    } else {
      console.log("signInWithCustomToken error", error.message);
    }
  }); // Note: Success should be handled by an onAuthStateChanged listener.
});
```

### Standalone Usage

```javascript
// Please note this needs to be the result of a user interaction
// (like a button click) otherwise it will get blocked as a popup
Rosefire.signIn("<REGISTRY_TOKEN>", (err, rfUser) => {
  if (err) {
    console.log("Rosefire error!", err);
    return;
  }
  console.log("Rosefire success!", rfUser);
  
  // TODO: Use the rfUser.token with your server.
});
```

## AngularJS SDK

If you're using angular in your project then there are bindings to make integration
into your project easier.

**Step 1:** Load the module

Make sure you include this script in the dist folder of the module in your html page.
```html
<!-- Make sure you load angular first! -->
<script src="node_modules/rosefire/dist/js/rosefire-angular.min.js"></script>
```

### Usage with Firebase

**Step 2:** You're all ready to authenticate if you use [AngularFire](https://www.firebase.com/docs/web/libraries/angular/).

```javascript
angular.module('app', ['firebase', 'rosefire']) 
  .controller('LoginCtrl', function($firebaseAuth, Rosefire, $scope, $q) {
    var auth = $firebaseAuth();
    $scope.login = function() {
      Rosefire.signIn("<REGISTRY_TOKEN>")
        .then(function(rfUser) {
          return auth.$signInWithCustomToken(rfUser.token);
        })
        .then(function(authData) {
          // User logged in!
        })
        .catch(function(err) {
          // User not logged in!
        });
    };
  });
```

### Standalone Usage

```javascript
angular.module('app', ['rosefire']) 
  .controller('LoginCtrl', function(Rosefire, $scope) {
    $scope.login = function() {
      Rosefire.signIn("<REGISTRY_TOKEN>")
        .then(function(rfUser) {
          // User logged in!
          // Use the token to authenticate with your server
          // checkout the server SDKs for more information.
        }, function(err) {
          // User not logged in!
        });
    };
  });
```

## Angular2 and Typescript Support

**Step 1: Setup and Installation**


This assumes that you are using the [Angular CLI Tool](https://github.com/angular/angular-cli#angular-cli) 
to manage and create your project. 

Once you've setup your project using `ng new <app-name>` you'll then need to run the npm install command.
```
npm install git+https://ada.csse.rose-hulman.edu/rosefire/javascript-sdk.git#2.1.1 --save
```

The you need to add the following in `angular-cli.json`:
```
"scripts": [
  "../node_modules/rosefire/dist/js/rosefire.min.js"
]
```

After that, you can import Rosefire into the Typescript file that you're
using via:

```typescript
import 'rosefire';
```

**Step 2: Usage**

### Angularfire2

Once you've setup Angularfire2 according to [their documentation](https://github.com/angular/angularfire2/blob/master/docs/1-install-and-setup.md)
you can use it in conjuction with Rosefire.

```typescript
constructor(private afAuth: AngularFireAuth) { }

Rosefire.signIn(environment.registryToken, (error, rfUser: RosefireUser) => {
  if (error) {
    // User not logged in!
    console.error(error);
    return;
  }
  this.afAuth.auth.signInWithCustomToken(rfUser.token);
});
```

### Standalone Usage

```typescript
Rosefire.signIn(environment.registryToken, (error, rfUser: RosefireUser) => {
  if (error) {
    // User not logged in!
    console.error(error);
    return;
  } else {
    // Use the token to authenticate with your server
    // checkout the server SDKs for more information.
  }
});
```
