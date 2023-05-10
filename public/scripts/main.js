var rhit = rhit || {};

/** globals */
rhit.FB_COLLECTION_TIMELINE = "TimelineEntries";
rhit.FB_KEY_ENTRY = "text";
rhit.FB_KEY_LAST_TOUCHED = "lastTouched";
rhit.FB_KEY_AUTHOR = 'author';
rhit.fbTimelineEntriesManager = null;
rhit.fbSingleTimelineEntryManager = null;
rhit.MainPage = null;
rhit.loginController = null;
rhit.incineratorPageController = null;
rhit.backgroundChecker = null;
rhit.user = null;
rhit.fbAuth = null;
_user = null;

//From stackoverflow
function htmlToElement(html){
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

rhit.PositivityTimelineController = class {
	constructor() {

		document.querySelector("#submitAddEntry").addEventListener("click",(event) => {
			const text = document.querySelector("#inputQuote").value;
			console.log("addquotesubmitbutton");
			rhit.fbTimelineEntriesManager.add(text);

		});

		document.querySelector("#menuSignOut").onclick = (event) => {
			this.signOut();
		};


		$("#addElementDialog").on("show.bs.modal", (event) => {
			document.querySelector("#inputQuote").value = "";
		});
		$("#addElementDialog").on("shown.bs.modal", (event) => {
			document.querySelector("#inputQuote").focus();
		});

		//start listening
		rhit.fbTimelineEntriesManager.beginListening(this.updateList.bind(this));

		let r = document.querySelector(':root');
		r.style.setProperty('--theme-color', `var(--color-${localStorage.getItem("theme")})`);
		r.style.setProperty('--theme-color-light', `var(--color-${localStorage.getItem("theme")}-light)`);
		let b = document.querySelector('#backgroundImage');
		b.style.setProperty('background-image', `url("../images/${localStorage.getItem("theme")}_back.jpg")`);
		let link = document.querySelector("link[rel~='icon']");
		if (!link) {
			link = document.createElement('link');
			link.rel = 'icon';
			document.head.appendChild(link);
		}
		link.href = localStorage.getItem(`favicon_${localStorage.getItem("theme")}`);
	}

	signOut(){
		firebase.auth().signOut().catch((error) => {
			// An error happened.
		  });
	}


	updateList() {
		const newList = htmlToElement('<div id="quoteListContainer"></div>');

		for(let i = 0; i < rhit.fbTimelineEntriesManager.length; i++){
			const mq = rhit.fbTimelineEntriesManager.getElementAtIndex(i);
			// console.log(mq.author);
			if(mq.author == localStorage.getItem("userID")){
				const newCard = this._createCard(mq);
				newCard.onclick = (event) => {
					window.location.href = `/timelineElement.html?id=${mq.id}`;
				}
				newList.appendChild(newCard);
			}
		}

		const oldList = document.querySelector("#quoteListContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;

		oldList.parentElement.appendChild(newList);
	}

	_createCard(happyElement) {
		// console.log(happyElement);
		let originalDateString = happyElement.timestamp.toDate();
		// originalDateString.toString().slice(0,-30)
		return htmlToElement(`<div class="card">
		<div class="card-body">
		<h5 style="text-align: center;" class="card-title">${happyElement.happyElement}</h5>
		<h6 style="text-align: end;"class="card-subtitle mb-2 text-muted">${originalDateString.toString().slice(0,-36)}</h6>
		</div>
	  </div>`);
	}
}

rhit.TimelineElement = class {
	constructor(id, text, author, timestamp) {
		this.id = id;
		this.happyElement = text; 
		this.author = author;
		this.timestamp = timestamp;
	}
}

rhit.ElementManager = class {
	constructor(ID) {
	  this._uid = ID;
	  this._documentSnapshots = [];
	  this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_TIMELINE);
	  this._unsubscribe = null;
	  this.author = firebase.firestore().collection(rhit.FB_COLLECTION_TIMELINE).doc('author');
	}
	get Author() {
		return this.author;
	}

	add(happyElement) {  
		this._ref.add({
			[rhit.FB_KEY_ENTRY]: happyElement,
			[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now(),
			[rhit.FB_KEY_AUTHOR]: localStorage.getItem("userID"),	//TODO fix: not sure if this variable is correct
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
	// beginListening(changeListener) {  
	// 	this._unsubscribe = this._ref.orderBy(rhit.FB_KEY_LAST_TOUCHED, "desc").limit(50).onSnapshot((querySnapshot) => {

	// 		this._documentSnapshots = querySnapshot.docs;

	// 		// querySnapshot.forEach((doc) => {
	// 		// 	console.log(doc.data());
	// 		// });

	// 		changeListener();
	// 	});
	//   }
	stopListening() {    
		this._unsubscribe();
	}
	get length() {
		return this._documentSnapshots.length;
	    }
	getElementAtIndex(index) {    
		const docSnapshot = this._documentSnapshots[index];
		const te = new rhit.TimelineElement(
			docSnapshot.id, docSnapshot.get(rhit.FB_KEY_ENTRY), docSnapshot.get(rhit.FB_KEY_AUTHOR), docSnapshot.get(rhit.FB_KEY_LAST_TOUCHED));
		return te;
	}
}

rhit.TimelineElementController = class {
	constructor() {

		document.querySelector("#submitEditQuote").addEventListener("click", (event) => {
			const text = document.querySelector("#inputQuote").value;
			rhit.fbSingleTimelineEntryManager.update(text);
		});


		$("#editQuoteDialog").on("show.bs.modal", (event) => {
			document.querySelector("#inputQuote").value = rhit.fbSingleTimelineEntryManager.happyText;
		});
		$("#editQuoteDialog").on("shown.bs.modal", (event) => {
			document.querySelector("#inputQuote").focus();
		});

		document.querySelector("#submitDeleteQuote").addEventListener("click", (event) => {
			rhit.fbSingleTimelineEntryManager.delete().then(function() {
				console.log("Document successfully deleted!");
				// window.location.href = "/positivityTimeline.html";
				window.location.href = `/positivityTimeline.html?uid=${localStorage.getItem("userID")}`;
			}).catch(function(error){
				console.error("Error removing document: ", error);
			});
		});

		rhit.fbSingleTimelineEntryManager.beginListening(this.updateView.bind(this));

		let r = document.querySelector(':root');
		r.style.setProperty('--theme-color', `var(--color-${localStorage.getItem("theme")})`);
		r.style.setProperty('--theme-color-light', `var(--color-${localStorage.getItem("theme")}-light)`);
		let b = document.querySelector('#backgroundImage');
		b.style.setProperty('background-image', `url("../images/${localStorage.getItem("theme")}_back.jpg")`);
		let link = document.querySelector("link[rel~='icon']");
		if (!link) {
			link = document.createElement('link');
			link.rel = 'icon';
			document.head.appendChild(link);
		}
		link.href = localStorage.getItem(`favicon_${localStorage.getItem("theme")}`);
	}
	updateView() {  
		document.querySelector("#cardQuote").innerHTML = rhit.fbSingleTimelineEntryManager.happyText;
		document.querySelector("#cardTime").innerHTML = rhit.fbSingleTimelineEntryManager.timestamp.toDate().toString().slice(0,-36);
	}
}

rhit.SingleElementManager = class {
 constructor(elementId) {
   this._documentSnapshot = {};
   this._unsubscribe = null;
   this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_TIMELINE).doc(elementId);
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
 update(happyText) {
	this._ref.update({
		[rhit.FB_KEY_ENTRY]: happyText,
		[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now(),
		[rhit.FB_KEY_AUTHOR]: localStorage.getItem("userID"),	//TODO fix: not sure if this variable is correct
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
	return this._documentSnapshot.get(rhit.FB_KEY_ENTRY);
 }

 get timestamp(){
	return this._documentSnapshot.get(rhit.FB_KEY_LAST_TOUCHED);
 }
}

rhit.CheerUpPageController = class {
	constructor(){
		document.querySelector("#quoteTextCheerUp").innerHTML = this.getQuote();
		// console.log(this.getQuote());
		// console.log(document.querySelector("#quoteTextCheerUp").innerHTML);
		document.querySelector("#CheerUpButton").addEventListener("click", (event) => {
			// location.reload();
			this.reloadData();
		});

		document.querySelector("#menuSignOut").onclick = (event) => {
			this.signOut();
		};

		let r = document.querySelector(':root');
		r.style.setProperty('--theme-color', `var(--color-${localStorage.getItem("theme")})`);
		r.style.setProperty('--theme-color-light', `var(--color-${localStorage.getItem("theme")}-light)`);
		let b = document.querySelector('#backgroundImage');
		b.style.setProperty('background-image', `url("../images/${localStorage.getItem("theme")}_back.jpg")`);
		let link = document.querySelector("link[rel~='icon']");
		if (!link) {
			link = document.createElement('link');
			link.rel = 'icon';
			document.head.appendChild(link);
		}
		link.href = localStorage.getItem(`favicon_${localStorage.getItem("theme")}`);
	}

	reloadData(){
		document.querySelector("#quoteTextCheerUp").innerHTML = this.getQuote();

		const openImg = (src) => {
			const base64ImageData = src;
			const contentType = 'image/png';
			const byteCharacters = atob(base64ImageData.substring(`data:${contentType};base64,`.length));
			const byteArrays = [];
		
			for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
			  const slice = byteCharacters.slice(offset, offset + 1024);
		
			  const byteNumbers = new Array(slice.length);
			  for (let i = 0; i < slice.length; i++) {
				byteNumbers[i] = slice.charCodeAt(i);
			  }
		
			  const byteArray = new Uint8Array(byteNumbers);
		
			  byteArrays.push(byteArray);
			}
			const blob = new Blob(byteArrays, { type: contentType });
			const blobUrl = URL.createObjectURL(blob);
		
			return blobUrl;
		  }

		let dataImage = localStorage.getItem('image');

		if(dataImage == null){
			document.getElementById("cheerUpImage").src=`https://picsum.photos/${Math.floor(600 + (Math.random() * 100))}/${Math.floor(600 + (Math.random() * 100))}`;
		}else {
			// console.log("working???");
			let bannerImg = document.getElementById("cheerUpImage");
			// console.log(dataImage);
			bannerImg.src = openImg(dataImage);
		}

		function toDataURL(src, callback, outputFormat) {
			let image = new Image();
			image.crossOrigin = 'Anonymous';
			image.onload = function () {
			  let canvas = document.createElement('canvas');
			  let ctx = canvas.getContext('2d');
			  let dataURL;
			  canvas.height = this.naturalHeight;
			  canvas.width = this.naturalWidth;
			  ctx.drawImage(this, 0, 0);
			  dataURL = canvas.toDataURL(outputFormat);
			  callback(dataURL);
			};
			image.src = src;
			if (image.complete || image.complete === undefined) {
			  image.src = "data:image/gif;base64, R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
			  image.src = src;
			}
		  }

		toDataURL(`https://picsum.photos/${Math.floor(900 + (Math.random() * 100))}/${Math.floor(900 + (Math.random() * 100))}`,
  		function (dataUrl) {
   		//  console.log('RESULT:', dataUrl)
		localStorage.setItem('image', dataUrl);
  }
)
		
	}

	getBase64Image(img) {
		var canvas = document.createElement("canvas");
		canvas.width = img.width;
		canvas.height = img.height;
	
		var ctx = canvas.getContext("2d");
		ctx.drawImage(img, 0, 0);
	
		var dataURL = canvas.toDataURL("image/png");
	
		return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
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
			if(final == "undefined"){
				final = "If your mind is too open your brains will fall out";
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

			if(final2 == "-:nul"){
				final2 = "-Unknown";
			}

			document.querySelector("#quoteTextCheerUp1").innerHTML = final2;

		});
	}
}

rhit.sideBarController = class {
	constructor(){
		document.querySelector("#menuTimeline").addEventListener("click", (event) => {
			window.location.href = `/positivityTimeline.html?uid=${localStorage.getItem("userID")}`;
		});
		document.querySelector("#menuIncinerator").addEventListener("click", (event) => {
			window.location.href = "/negativityIncinerator.html";
		});
		document.querySelector("#menuCheerUp").addEventListener("click", (event) => {
			window.location.href = "/CheerUp.html";
		});
		document.querySelector("#menuSignOut").addEventListener("click", (event) => {
			// rhit.loginController.signOut();
			window.location.href = "/";	//need to enable authentication to have logout method
		});
		document.querySelector("#menuSettings").addEventListener("click", (event) => {
			window.location.href = "/settings.html";	
		});
	}

	signOut(){
		firebase.auth().signOut().catch((error) => {
			// An error happened.
		  });
	}
}

rhit.FBAuth = class {
	constructor(){
		let uid;
		let tempID;
		this._user = null;
		
	}

	createAccount(inputEmail, inputPassword){
		let uid;
		let tempID;
		firebase.auth().createUserWithEmailAndPassword(inputEmail.value, inputPassword.value)
			.then((userCredential) => {
			// Signed in
			let user = userCredential.user;
			console.log("Created user");
			// uid = user.uid;
			tempID = uid;
			window.location.href = `/positivityTimeline.html?uid=${tempID}`;
			this.changeListener();
			// ...
			})
			.catch((error) => {
				var errorCode = error.code;
				var errorMessage = error.message;
				// console.log("Create user error", errorCode, errorMessage);
			});

			firebase.auth().onAuthStateChanged((user) => {
				if (user) {
					rhit.user = JSON.stringify(user);
					// console.log(rhit.user);
					localStorage.setItem("user", rhit.user);			
					this._user = user;
					uid = user.uid;
					var displayName = user.displayName;
					var email = user.email;
					var emailVerified = user.emailVerified;
					var photoURL = user.photoURL;
					var isAnonymous = user.isAnonymous;
					var providerData = user.providerData;
					console.log("Signed in", uid);
					// window.location.href = `/positivityTimeline.html?uid=${uid}`;
					tempID = uid;
					localStorage.setItem("userID", uid);
				} else {
					console.log("No user is signed in.");
					// window.location.href = `/index.html`;
					localStorage.setItem("userID", "");
				}
			  });
	}

	logIn(inputEmail, inputPassword){
		let uid;
		let tempID;
		firebase.auth().signInWithEmailAndPassword(inputEmail.value, inputPassword.value)
			.then((userCredential) => {
				// Signed in
				window.location.href = `/positivityTimeline.html?uid=${uid}`;
				console.log("Signed in", uid);
				// let user = userCredential.user;
				// this._user.uid = userCredential.user.uid;
				tempID = uid;

				
				// ...
			})
			.catch((error) => {
				var errorCode = error.code;
				var errorMessage = error.message;
				// console.log("Create user error", errorCode, errorMessage);
			});

			firebase.auth().onAuthStateChanged((user) => {
				if (user) {
					rhit.user = JSON.stringify(user);
					// console.log(rhit.user);
					localStorage.setItem("user", rhit.user);			
					this._user = user;
					uid = user.uid;
					var displayName = user.displayName;
					var email = user.email;
					var emailVerified = user.emailVerified;
					var photoURL = user.photoURL;
					var isAnonymous = user.isAnonymous;
					var providerData = user.providerData;
					console.log("Signed in", uid);
					// window.location.href = `/positivityTimeline.html?uid=${uid}`;
					tempID = uid;
					localStorage.setItem("userID", uid);
				} else {
					console.log("No user is signed in.");
					// window.location.href = `/index.html`;
					localStorage.setItem("userID", "");
				}
			  });
	}


	changeListener(){
		firebase.auth().onAuthStateChanged((user) => {
			if (user) {
				rhit.user = JSON.stringify(user);
				// console.log(rhit.user);
				localStorage.setItem("user", rhit.user);			
				this._user = user;
				uid = user.uid;
				var displayName = user.displayName;
				var email = user.email;
				var emailVerified = user.emailVerified;
				var photoURL = user.photoURL;
				var isAnonymous = user.isAnonymous;
				var providerData = user.providerData;
				console.log("Signed in", uid);
				// window.location.href = `/positivityTimeline.html?uid=${uid}`;
				tempID = uid;
				localStorage.setItem("userID", uid);
			} else {
				console.log("No user is signed in.");
				// window.location.href = `/index.html`;
				localStorage.setItem("userID", "");
			}
		  });
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

	firebase.auth().onAuthStateChanged((user) => {
	if (user) {
		// rhit.user = JSON.stringify(user);
		console.log(user);
		// localStorage.setItem("user", rhit.user);			
		this._user = user;
		let uid = user.uid;

		console.log("Signed in", uid);
		// window.location.href = `/positivityTimeline.html?uid=${uid}`;
		// tempID = uid;
		localStorage.setItem("userID", uid);
	} else {
		console.log("No user is signed in.");
		// window.location.href = `/index.html`;
		localStorage.setItem("userID", "");
	}
	});
  
	};

	get isSignedIn() {
		return !!this._user;
	}
	get uid() {
		return this._user.uid;
		// return localStorage.getItem("userID");
	}

	deleteAccount(){
		this._user.delete().then(() => {
			console.log("User deleted")
		  }).catch((error) => {
			// An error ocurred
			// ...
		  });
	}
	

	// rhit.startFirebaseUI();
}

rhit.LoginPageController = class{
	constructor(){
		let uid;
		let tempID;

		let r = document.querySelector(':root');
		r.style.setProperty('--theme-color', `var(--color-${localStorage.getItem("theme")})`);
		r.style.setProperty('--theme-color-light', `var(--color-${localStorage.getItem("theme")}-light)`);
		let b = document.querySelector('#backgroundImage');
		b.style.setProperty('background-image', `url("../images/${localStorage.getItem("theme")}_back.jpg")`);
		let link = document.querySelector("link[rel~='icon']");
		if (!link) {
			link = document.createElement('link');
			link.rel = 'icon';
			document.head.appendChild(link);
		}
		link.href = localStorage.getItem(`favicon_${localStorage.getItem("theme")}`);
		let passIn = document.querySelector('#passIn');
		passIn.style.setProperty("color",`var(--color-${localStorage.getItem("theme")})`);
		let emailIn = document.querySelector('#emailIn');
		emailIn.style.setProperty("color",`var(--color-${localStorage.getItem("theme")})`);

		this._user = null;
		const inputEmail = document.querySelector("#inputEmail");
		inputEmail.style.setProperty("color",`var(--color-${localStorage.getItem("theme")})`);
   		const inputPassword = document.querySelector("#inputPassword");
		inputPassword.style.setProperty("color",`var(--color-${localStorage.getItem("theme")})`);

		

		document.querySelector("#createAccountButton").onclick = (event) => {
			console.log(`Create account for email: ${inputEmail.value}  password: ${inputPassword.value}`);
			rhit.fbAuth.createAccount(inputEmail, inputPassword);
		};
	
	
		document.querySelector("#logInButton").onclick = (event) => {
			console.log(`Log in to existing account for email: ${inputEmail.value}  password: ${inputPassword.value}`);
			rhit.fbAuth.logIn(inputEmail, inputPassword);
		};

		document.querySelector("#logInRosefire").onclick = (event) => {
			// this.signInRosefire();
			rhit.fbAuth.signInRosefire();
			window.location.href = `/positivityTimeline.html?uid=${localStorage.getItem("userID")}`;
		};

	}


	
	// get uid() {
	// 	return tempID;
	// }

	signOut(){
		firebase.auth().signOut().catch((error) => {
			// An error happened.
		  });
	};
}

rhit.checkForRedirects = function() {
	if(document.querySelector("#loginPage") && rhit.fbAuthManager.isSignedIn){
		window.location.href = "/positivityTimeline.html";
	} 
	if(!document.querySelector("#loginPage") && !rhit.fbAuthManager.isSignedIn){
		window.location.href = "/index.html";
	} 
};

rhit.SettingsPageController = class {
	constructor(){
		this.changeTheme(localStorage.getItem("theme"));

		document.querySelector("#greenTheme").onclick = (event) => {
			localStorage.setItem("theme", "green");
			this.changeTheme("green");
			
		};
		document.querySelector("#blueTheme").onclick = (event) => {
			localStorage.setItem("theme", "blue");
			this.changeTheme("blue");
		};
		document.querySelector("#orangeTheme").onclick = (event) => {
			localStorage.setItem("theme", "orange");
			this.changeTheme("orange");
		};
		document.querySelector("#purpleTheme").onclick = (event) => {
			localStorage.setItem("theme", "purple");
			this.changeTheme("purple");
		};
		document.querySelector("#pinkTheme").onclick = (event) => {
			localStorage.setItem("theme", "pink");
			this.changeTheme("pink");
		};
		document.querySelector("#redTheme").onclick = (event) => {
			localStorage.setItem("theme", "red");
			this.changeTheme("red");
		};

		document.querySelector('#deleteDataButton').onclick = (event) => {
			// let use1 = localStorage.getItem("user");
			// console.log(use1)
			// let use = JSON.parse(use1);
			// console.log(use)
			// const user = firebase.auth().currentUser;
			rhit.fbAuth.deleteAccount();
			document.location.href = "/";

		}
	}

	changeTheme(aaaatheme){
		let r = document.querySelector(':root');
			r.style.setProperty('--theme-color', `var(--color-${aaaatheme})`);
			r.style.setProperty('--theme-color-light', `var(--color-${aaaatheme}-light)`);
			let b = document.querySelector('#backgroundImage');
			b.style.setProperty('background-image', `url("../images/${aaaatheme}_back.jpg")`);
			let link = document.querySelector("link[rel~='icon']");
		if (!link) {
			link = document.createElement('link');
			link.rel = 'icon';
			document.head.appendChild(link);
		}
		link.href = `images/${aaaatheme}_favicon.ico`;
	}

}


rhit.IncineratorPageController = class {
	constructor(themeControllerClass){

		let r = document.querySelector(':root');
		r.style.setProperty('--theme-color', `var(--color-${localStorage.getItem("theme")})`);
		r.style.setProperty('--theme-color-light', `var(--color-${localStorage.getItem("theme")}-light)`);
		let b = document.querySelector('#backgroundImage');
		b.style.setProperty('background-image', `url("../images/${localStorage.getItem("theme")}_back.jpg")`);
		let link = document.querySelector("link[rel~='icon']");
		if (!link) {
			link = document.createElement('link');
			link.rel = 'icon';
			document.head.appendChild(link);
		}
		link.href = localStorage.getItem(`favicon_${localStorage.getItem("theme")}`);
		// console.log(link.href)

		document.querySelector("#menuSignOut").onclick = (event) => {
			this.signOut();
		};


		

		
	}



	signOut(){
		firebase.auth().signOut().catch((error) => {
			// An error happened.
		  });
	}
}

rhit.BackgroundChecker = class {
    constructor(){
		this.colorArray = ["green", "blue", "orange", "purple", "pink", "red"]
		this.checkBackground();
		this.checkFavicon();
        this.checkTextTheme();
		this.checkCheerUpImage();
    }

	toDataURL(src, callback, outputFormat) {
		let image = new Image();
		image.crossOrigin = 'Anonymous';
		image.onload = function () {
		  let canvas = document.createElement('canvas');
		  let ctx = canvas.getContext('2d');
		  let dataURL;
		  canvas.height = this.naturalHeight;
		  canvas.width = this.naturalWidth;
		  ctx.drawImage(this, 0, 0);
		  dataURL = canvas.toDataURL(outputFormat);
		  callback(dataURL);
		};
		image.src = src;
		if (image.complete || image.complete === undefined) {
		  image.src = "data:image/gif;base64, R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
		  image.src = src;
		}
	}

	checkBackground(){
		if(localStorage.getItem('background_green') == 'YoUr MoM'){		//should never occur
			this.checkBackgroundHelper("green");
			this.checkBackgroundHelper("blue");
			this.checkBackgroundHelper("orange");
			this.checkBackgroundHelper("purple");
			this.checkBackgroundHelper("pink");
			this.checkBackgroundHelper("red");
			this.toDataURL(`images/aaa.jpg`,
             function (dataUrl) {
                console.log('RESULT:', dataUrl)
                localStorage.setItem('background_red', dataUrl);
			});
        }
	}

	checkBackgroundHelper(color){
		this.toDataURL(`images/${color}_back.jpg`,
             function (dataUrl) {
                console.log('RESULT:', dataUrl)
                localStorage.setItem(`background_${color}`, dataUrl);
			});
	}

	checkFavicon(){
		if(localStorage.getItem('favicon_green') == null){
			this.checkFaviconHelper("green");
			this.checkFaviconHelper("blue");
			this.checkFaviconHelper("orange");
			this.checkFaviconHelper("purple");
            this.checkFaviconHelper("pink");
            this.checkFaviconHelper("red");
			// console.log("favicons in local storage")
		}
	}

	checkFaviconHelper(color){
		this.toDataURL(`images/${color}_favicon.ico`,
				function (dataUrl) {
					// console.log("uhhhh")
					// console.log('RESULT:', dataUrl)
					localStorage.setItem(`favicon_${color}`, dataUrl);
				});
	}

	checkTextTheme(){

		let color;
		if(localStorage.getItem("theme") == "purple" || localStorage.getItem("theme") == "green" || localStorage.getItem("theme") == "blue" ){
			color = "light";
		} else{
			color = "dark";
		}

		let r = document.querySelector(':root');
		r.style.setProperty('--theme-color-card', `var(--transparent-${color})`);
	}

	checkCheerUpImage(){
		let dataImage = localStorage.getItem('image');

		if(dataImage == null){
			// document.getElementById("cheerUpImage").src=`https://picsum.photos/${Math.floor(600 + (Math.random() * 100))}/${Math.floor(600 + (Math.random() * 100))}`;
			this.toDataURL(`https://picsum.photos/${Math.floor(900 + (Math.random() * 100))}/${Math.floor(900 + (Math.random() * 100))}`,
				function (dataUrl) {
				//  console.log('RESULT:', dataUrl)
				localStorage.setItem('image', dataUrl);
			})
		}
	}

    
}

/* Main */
/** function and class syntax examples */
rhit.main = function () {
	console.log("Ready");
	rhit.fbAuth = new rhit.FBAuth();
	if(localStorage.getItem("theme") == null){
		localStorage.setItem("theme","green");
	}else{
		console.log("storage is not null");
	}
	rhit.backgroundChecker = new rhit.BackgroundChecker();

	function getBase64Image(img) {
		var canvas = document.createElement("canvas");
		canvas.width = img.width;
		canvas.height = img.height;
	
		var ctx = canvas.getContext("2d");
		ctx.drawImage(img, 0, 0);
	
		var dataURL = canvas.toDataURL("image/png");
	
		return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
	}

	if(document.querySelector("#QuotePage")){
		console.log("list page");
		rhit.fbTimelineEntriesManager = new rhit.ElementManager();
		new rhit.PositivityTimelineController();
		console.log("List page created");
	}

	if(document.querySelector("#detailPage")){
		console.log("Detail page");

		const queryString = window.location.search;
		console.log(queryString);
		const urlParams = new URLSearchParams(queryString);
		const elementId = urlParams.get("id");

		if(!elementId){
			console.log(`Error! Missing element id!`);
			window.location.href = "/";
		}

		rhit.fbSingleTimelineEntryManager = new rhit.SingleElementManager(elementId);
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

	if(document.querySelector("#negativityIncinerator")){
		rhit.incineratorPageController = new rhit.IncineratorPageController();
		console.log("incinerator page controller created");
	}

	if(document.querySelector("#mainPage")){
		console.log("login page");
		rhit.loginController = new rhit.LoginPageController();
		console.log("Login page controller created")
	}

	if(document.querySelector("#settingsPage")){
		console.log("settings page");
		rhit.settingsController = new rhit.SettingsPageController();
		console.log("setting page controller created")
	}

};


rhit.startFirebaseUI = function() {		//used for firebase authentication ui
	var uiConfig = {
		signInSuccessUrl: `/positivityTimeline.html?uid=${rhit.loginController.uid}`, // redirecting URL
		signInOptions: [
			// firebase.auth.GoogleAuthProvider.PROVIDER_ID,
			// firebase.auth.EmailAuthProvider.PROVIDER_ID,
			// firebase.auth.PhoneAuthProvider.PROVIDER_ID,
			// firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID
		],
	};
	const ui = new firebaseui.auth.AuthUI(firebase.auth());
	ui.start('#firebaseui-auth-container', uiConfig);
 }


rhit.main();
