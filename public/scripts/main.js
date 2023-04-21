var rhit = rhit || {};

/** globals */
rhit.FB_COLLECTION_MOVIEQUOTE = "TimelineEntries";
rhit.FB_KEY_QUOTE = "text";
rhit.FB_KEY_MOVIE = "text";
rhit.FB_KEY_LAST_TOUCHED = "lastTouched";
rhit.FB_KEY_AUTHOR = 'author';
rhit.fbMovieQuotesManager = null;
rhit.fbSingleQuoteManager = null;
rhit.MainPage = '/positivityTimeline.html';
rhit.loginController = null;

//From stackoverflow
function htmlToElement(html){
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

rhit.PositivityTimelineController = class {
	constructor() {

		document.querySelector("#submitAddQuote").addEventListener("click",(event) => {
			const quote = document.querySelector("#inputQuote").value;
			// const movie = document.querySelector("#inputMovie").value;
			console.log("addquotesubmitbutton");
			// console.log(quote);
			rhit.fbMovieQuotesManager.add(quote, quote);

		});

		document.querySelector("#menuSignOut").onclick = (event) => {
			this.signOut();
		};


		$("#addQuoteDialog").on("show.bs.modal", (event) => {
			document.querySelector("#inputQuote").value = "";
			// document.querySelector("#inputMovie").value = "";
		});
		$("#addQuoteDialog").on("shown.bs.modal", (event) => {
			document.querySelector("#inputQuote").focus();
		});

		//start listening
		rhit.fbMovieQuotesManager.beginListening(this.updateList.bind(this));
	}

	signOut(){
		firebase.auth().signOut().catch((error) => {
			// An error happened.
		  });
	}


	updateList() {
		const newList = htmlToElement('<div id="quoteListContainer"></div>');

		for(let i = 0; i < rhit.fbMovieQuotesManager.length; i++){
			const mq = rhit.fbMovieQuotesManager.getElementAtIndex(i);
			const newCard = this._createCard(mq);
			newCard.onclick = (event) => {
				window.location.href = `/timelineElement.html?id=${mq.id}`;
			}
			newList.appendChild(newCard);
		}

		const oldList = document.querySelector("#quoteListContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;

		oldList.parentElement.appendChild(newList);
	}

	_createCard(happyElement) {
		// console.log(happyElement);
		return htmlToElement(`<div class="card">
		<div class="card-body">
		  <h5 style="text-align: center;" class="card-title">${happyElement.happyElement}</h5>
		</div>`);
	}
}
   
rhit.TimelineElement = class {
	constructor(id, quote, movie) {
		this.id = id;
		this.happyElement = quote;
		this.otherHappyElement = movie;  
	}
}

rhit.ElementManager = class {
	constructor(ID) {
	  this._uid = ID;
	  this._documentSnapshots = [];
	  this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_MOVIEQUOTE);
	  this._unsubscribe = null;
	}
	add(happyElement, otherHappyElement) {  
    this._ref.add({
		[rhit.FB_KEY_QUOTE]: happyElement,
		[rhit.FB_KEY_MOVIE]: otherHappyElement,
		[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now(),
		// [rhit.FB_KEY_AUTHOR]: rhit.loginController.uid,	//TODO fix: not sure if this variable is correct
	})
	.then(function(docRef){
		console.log("Document written with ID: ", docRef.id);
	})
	.catch(function(error){
		console.error("error adding document: ", docRef.id);
	});

	  }
	  beginListening(changeListener) {  

		let query = this._ref.orderBy(rhit.FB_KEY_LAST_TOUCHED, "desc").limit(50)
		if(this._uid){
			query = query.where(rhit.FB_KEY_AUTHOR, "==", this._uid);
		}

		this._unsubscribe = query.onSnapshot((querySnapshot) => {

			this._documentSnapshots = querySnapshot.docs;

			changeListener();
		});
	  }
	stopListening() {    
		this._unsubscribe();
	}
	get length() {
		return this._documentSnapshots.length;
	    }
	getElementAtIndex(index) {    
		const docSnapshot = this._documentSnapshots[index];
		const mq = new rhit.TimelineElement(
			docSnapshot.id, docSnapshot.get(rhit.FB_KEY_QUOTE),docSnapshot.get(rhit.FB_KEY_MOVIE),
		);
		return mq;
	}
}

rhit.TimelineElementController = class {
	constructor() {

		document.querySelector("#submitEditQuote").addEventListener("click", (event) => {
			const quote = document.querySelector("#inputQuote").happyText;
			// const movie = document.querySelector("#inputMovie").value;
			rhit.fbSingleQuoteManager.update(quote, quote);
		});


		$("#editQuoteDialog").on("show.bs.modal", (event) => {
			document.querySelector("#inputQuote").value = rhit.fbSingleQuoteManager.happyText;
			// document.querySelector("#inputMovie").value = rhit.fbSingleQuoteManager.movie;
		});
		$("#editQuoteDialog").on("shown.bs.modal", (event) => {
			document.querySelector("#inputQuote").focus();
		});

		document.querySelector("#submitDeleteQuote").addEventListener("click", (event) => {
			rhit.fbSingleQuoteManager.delete().then(function() {
				console.log("Document successfully deleted!");
				window.location.href = "/positivityTimeline.html";
			}).catch(function(error){
				console.error("Error removing document: ", error);
			});
		});

		rhit.fbSingleQuoteManager.beginListening(this.updateView.bind(this));
	}
	updateView() {  
		document.querySelector("#cardQuote").innerHTML = rhit.fbSingleQuoteManager.happyText;
		// document.querySelector("#cardMovie").innerHTML = rhit.fbSingleQuoteManager.movie;

	}
}

rhit.SingleElementManager = class {
 constructor(movieQuoteId) {
   this._documentSnapshot = {};
   this._unsubscribe = null;
   this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_MOVIEQUOTE).doc(movieQuoteId);
   console.log(`listening to ${this._ref.path}`);
 }
 beginListening(changeListener) {
	this._unsubscribe = this._ref.onSnapshot((doc) => {
		if(doc.exists) {
			console.log("Document data:", doc.data());
			this._documentSnapshot = doc;
			changeListener();
		}else {
			console.log("No such document!");
			//window.location.href = "/";
		}
	});

 }
 stopListening() {
   this._unsubscribe();
 }
 update(happyText, otherHappyText) {
	this._ref.update({
		[rhit.FB_KEY_QUOTE]: happyText,
		[rhit.FB_KEY_MOVIE]: otherHappyText,
		[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now(),
		// [rhit.FB_KEY_AUTHOR]: rhit.loginController.uid,	//TODO fix: not sure if this variable is correct
	})
	.then(() => {
		console.log("Document updated successfully!");
	})
	.catch(function(error){
		console.error("error updating document: ", error);
	});
 }
 delete() {
	return this._ref.delete()
 }

 get happyText(){
	return this._documentSnapshot.get(rhit.FB_KEY_QUOTE);
 }
 get otherHappyText(){
	return this._documentSnapshot.get(rhit.FB_KEY_MOVIE);
 }
}

rhit.CheerUpPageController = class {
	constructor(){
		document.querySelector("#quoteTextCheerUp").innerHTML = this.getQuote();
		// console.log(this.getQuote());
		console.log(document.querySelector("#quoteTextCheerUp").innerHTML);
		document.querySelector("#CheerUpButton").addEventListener("click", (event) => {
			location.reload();
		});

		document.querySelector("#menuSignOut").onclick = (event) => {
			this.signOut();
		};
	}

	signOut(){
		firebase.auth().signOut().catch((error) => {
			// An error happened.
		  });
	}

	getQuote(){
		let index = Math.floor(1649 * Math.random());
		// console.log(index);
		// let index = 1649;
		fetch("https://type.fit/api/quotes")
		.then(function(response) {
			return response.json();
		})
		.then(function(data) {
			// console.log(JSON.stringify(data));
			// console.log(JSON.stringify(data[index]));
			let curIndex = JSON.stringify(data[index]);
			let final = "";
			for(let i = 9; i < curIndex.length; i++){		//These loops parse the JSON data for the quote
				if(curIndex[i] == '"'){						//Please dont touch for now
					break;
				}
				final += curIndex[i];
			}
			document.querySelector("#quoteTextCheerUp").innerHTML = final;

			final = "";
			let stopIndex = 0;
			for(let i = curIndex.length - 3; i > 0; i--){
				if(curIndex[i] == '"'){
					stopIndex = i;
					break;
				}
				final += curIndex[i];
			}
			for(let i = stopIndex; i < curIndex.length; i++){
				if(curIndex[i] == '"'){
					break;
				}
				final += curIndex[i];
			}
			let final2 = "-";
			for(let i = final.length - 1; i > -1; i--){
				final2 += final[i];
			}

			document.querySelector("#quoteTextCheerUp1").innerHTML = final2;

		});
	}
}

rhit.sideBarController = class {
	constructor(){
		document.querySelector("#menuShowAllQuotes").addEventListener("click", (event) => {
			window.location.href = "/positivityTimeline.html";
		});
		document.querySelector("#menuShowMyQuotes").addEventListener("click", (event) => {
			window.location.href = "/negativityIncinerator.html";
		});
		document.querySelector("#menuCheerUp").addEventListener("click", (event) => {
			window.location.href = "/CheerUp.html";
		});
		document.querySelector("#menuSignOut").addEventListener("click", (event) => {
			// rhit.loginController.signOut();
			window.location.href = "/";	//need to enable authentication to have logout method
		});
	}

	signOut(){
		firebase.auth().signOut().catch((error) => {
			// An error happened.
		  });
	}
}

rhit.LoginPageController = class{
	constructor(){
		this._user = null;
		const inputEmail = document.querySelector("#inputEmail");
   		const inputPassword = document.querySelector("#inputPassword");
		rhit.startFirebaseUI();

		document.querySelector("#createAccountButton").onclick = (event) => {
			console.log(`Create account for email: ${inputEmail.value}  password: ${inputPassword.value}`);
			firebase.auth().createUserWithEmailAndPassword(inputEmail.value, inputPassword.value)
			.then((userCredential) => {
			// Signed in
			var user = userCredential.user;
			console.log("Created user");
			window.location.href = "/positivityTimeline.html";
			// ...
			})
			.catch((error) => {
				var errorCode = error.code;
				var errorMessage = error.message;
				// console.log("Create user error", errorCode, errorMessage);
			});
		};
	
	
		document.querySelector("#logInButton").onclick = (event) => {
			console.log(`Log in to existing account for email: ${inputEmail.value}  password: ${inputPassword.value}`);
			firebase.auth().signInWithEmailAndPassword(inputEmail.value, inputPassword.value)
			.then((userCredential) => {
				// Signed in
				window.location.href = "/positivityTimeline.html";
				console.log("Signed in", uid);
				var user = userCredential.user;
				
				// ...
			})
			.catch((error) => {
				var errorCode = error.code;
				var errorMessage = error.message;
				// console.log("Create user error", errorCode, errorMessage);
			});
		};
		
		firebase.auth().onAuthStateChanged((user) => {
			if (user) {
				this._user = user;
				var uid = user.uid;
				var displayName = user.displayName;
				var email = user.email;
				var emailVerified = user.emailVerified;
				var photoURL = user.photoURL;
				var isAnonymous = user.isAnonymous;
				var providerData = user.providerData;
				console.log("Signed in", uid);
			} else {
				console.log("No user is signed in.");
			}
		  });

		document.querySelector("#rosefireButton").onclick = (event) => {
			this.signInRosefire();
		};

	}

	get isSignedIn() {
		return !!this._user;
	}
	get uid() {
		return this._user.uid;
	}

	signInRosefire() {
		console.log("Sign in reached with rosefire");
	Rosefire.signIn("ea2c30dc-6d5f-44a2-8c08-6daaf8433dad", (err, rfUser) => {	//This has correct key for B+
	if (err) {
	  console.log("Rosefire error!", err);
	  return;
	}

	

	firebase.auth().signInWithCustomToken(rfUser.token).catch((error) => {
			const errorCode = error.code;
			const errorMessage = error.message;
			// console.log("Create user error", errorCode, errorMessage);
			if(errorCode === 'auth/invalid-custom-token'){
				alert('The token you provided is not valid');
			} else{
				console.error("custom auth error", errorCode, errorMessage);
			}
		});

 	 });
  
	};
	get uid() {
		return this._user.uid;
	}

	signOut(){
		firebase.auth().signOut().catch((error) => {
			// An error happened.
		  });
	};
}

rhit.checkForRedirects = function() {
	if(document.querySelector("#loginPage") && rhit.fbAuthManager.isSignedIn){
		window.location.href = "/list.html";
	} 
	if(!document.querySelector("#loginPage") && !rhit.fbAuthManager.isSignedIn){
		window.location.href = "/";
	} 
};

rhit.IncineratorPageController = class {
	constructor(){
		document.querySelector("#menuSignOut").onclick = (event) => {
			this.signOut();
		};
	}

	allowDrop(ev) {
		ev.preventDefault();
	  }
	  
	drag(ev) {
		ev.dataTransfer.setData("text", ev.target.id);
	  }
	  
	drop(ev) {
		ev.preventDefault();
		ev.target.appendChild(document.getElementById("fire"));
		document.querySelector("#inputnegative").innerHTML = "";
	  }

	signOut(){
		firebase.auth().signOut().catch((error) => {
			// An error happened.
		  });
	}
}

/* Main */
/** function and class syntax examples */
rhit.main = function () {
	console.log("Ready");

	if(document.querySelector("#QuotePage")){
		console.log("list page");
		rhit.fbMovieQuotesManager = new rhit.ElementManager();
		new rhit.PositivityTimelineController();
		console.log("List page created");
	}

	if(document.querySelector("#detailPage")){
		console.log("Detail page");

		const queryString = window.location.search;
		console.log(queryString);
		const urlParams = new URLSearchParams(queryString);
		const movieQuoteId = urlParams.get("id");

		if(!movieQuoteId){
			console.log(`Error! Missing movie quote id!`);
			window.location.href = "/";
		}

		rhit.fbSingleQuoteManager = new rhit.SingleElementManager(movieQuoteId);
		new rhit.TimelineElementController();

	}

	if(document.querySelector("#CheerUpPage")){
		rhit.cheerUpContoller = new rhit.CheerUpPageController();
		console.log("cheer up page controller created");
	}

	if(document.querySelector("#dw-s2")){
		rhit.sideController = new rhit.sideBarController();
		console.log("Side bar controller created");
	}

	if(document.querySelector("#mainPage")){
		console.log("login page");
		rhit.loginController = new rhit.LoginPageController();
		console.log("Login page controller created")
	}

};

rhit.startFirebaseUI = function() {		//used for firebase authentication ui
	var uiConfig = {
		signInSuccessUrl: rhit.MainPage, // redirecting URL
		signInOptions: [
			// firebase.auth.GoogleAuthProvider.PROVIDER_ID,
			// firebase.auth.EmailAuthProvider.PROVIDER_ID,
			// firebase.auth.PhoneAuthProvider.PROVIDER_ID,
			firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID
		],
	};
	const ui = new firebaseui.auth.AuthUI(firebase.auth());
	ui.start('#firebaseui-auth-container', uiConfig);
 }


rhit.main();
