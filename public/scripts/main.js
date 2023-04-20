var rhit = rhit || {};

/** globals */
rhit.FB_COLLECTION_MOVIEQUOTE = "TimelineEntries";
rhit.FB_KEY_QUOTE = "text";
rhit.FB_KEY_MOVIE = "text";
rhit.FB_KEY_LAST_TOUCHED = "lastTouched";
rhit.fbMovieQuotesManager = null;
rhit.fbSingleQuoteManager = null;
rhit.MainPage = '/positivityTimeline.html';

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


	updateList() {
		const newList = htmlToElement('<div id="quoteListContainer"></div>');

		for(let i = 0; i < rhit.fbMovieQuotesManager.length; i++){
			const mq = rhit.fbMovieQuotesManager.getMovieQuoteAtIndex(i);
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

	_createCard(movieQuote) {
		return htmlToElement(`<div class="card">
		<div class="card-body">
		  <h5 style="text-align: center;" class="card-title">${movieQuote.quote}</h5>
		</div>`);
	}
}
   
rhit.TimelineElement = class {
	constructor(id, quote, movie) {
		this.id = id;
		this.quote = quote;
		this.movie = movie;  
	}
}

rhit.ElementManager = class {
	constructor() {
	  this._documentSnapshots = [];
	  this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_MOVIEQUOTE);
	  this._unsubscribe = null;
	}
	add(quote, movie) {  
    this._ref.add({
		[rhit.FB_KEY_QUOTE]: quote,
		[rhit.FB_KEY_MOVIE]: movie,
		[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now(),
	})
	.then(function(docRef){
		console.log("Document written with ID: ", docRef.id);
	})
	.catch(function(error){
		console.error("error adding document: ", docRef.id);
	});

	  }
	beginListening(changeListener) {  
		this._unsubscribe = this._ref.orderBy(rhit.FB_KEY_LAST_TOUCHED, "desc").limit(50).onSnapshot((querySnapshot) => {

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
	getMovieQuoteAtIndex(index) {    
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
			const quote = document.querySelector("#inputQuote").value;
			// const movie = document.querySelector("#inputMovie").value;
			rhit.fbSingleQuoteManager.update(quote, quote);
		});


		$("#editQuoteDialog").on("show.bs.modal", (event) => {
			document.querySelector("#inputQuote").value = rhit.fbSingleQuoteManager.quote;
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
		document.querySelector("#cardQuote").innerHTML = rhit.fbSingleQuoteManager.quote;
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
 update(quote, movie) {
	this._ref.update({
		[rhit.FB_KEY_QUOTE]: quote,
		[rhit.FB_KEY_MOVIE]: movie,
		[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now(),
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

 get quote(){
	return this._documentSnapshot.get(rhit.FB_KEY_QUOTE);
 }
 get movie(){
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
	}

	getQuote(){
		let index = Math.floor(1649 * Math.random());
		console.log(index);
		// let index = 1649;
		fetch("https://type.fit/api/quotes")
		.then(function(response) {
			return response.json();
		})
		.then(function(data) {
			console.log(JSON.stringify(data));
			console.log(JSON.stringify(data[index]));
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
			window.location.href = "/";	//need to enable authentication to have logout method
		});
	}
}

rhit.LoginPageController = class{
	constructor(){
		rhit.startFirebaseUI();
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
			firebase.auth.GoogleAuthProvider.PROVIDER_ID,
			firebase.auth.EmailAuthProvider.PROVIDER_ID,
			firebase.auth.PhoneAuthProvider.PROVIDER_ID,
			firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID
		],
	};
	const ui = new firebaseui.auth.AuthUI(firebase.auth());
	ui.start('#firebaseui-auth-container', uiConfig);
 }


rhit.main();
