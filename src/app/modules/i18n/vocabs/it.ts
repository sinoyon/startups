// IT
export const locale = {
	lang: 'it',
	data: {
		TRANSLATOR: {
			SELECT: 'Select your language',
		},
		MENU: {
			NEW: 'new',
			ACTIONS: 'Actions',
			CREATE_POST: 'Create New Post',
			PAGES: 'Pages',
			FEATURES: 'Features',
			APPS: 'Apps',
			DASHBOARD: 'Dashboard',
		},
		AUTH: {
			GENERAL: {
				OR: 'Or',
				SUBMIT_BUTTON: 'Invia',
				NO_ACCOUNT: 'Non hai un account?',
				SIGNUP_BUTTON: 'Registrati',
				FORGOT_BUTTON: 'Password dimenticata',
				BACK_BUTTON: 'Indietro',
				PRIVACY: 'Privacy',
				LEGAL: 'Legal',
				CONTACT: 'Contact',
				WELCOME: 'Aggregatore di Equity e Lending Crowdfunding',
				DESCRIPTION: "Registrandoti potrai seguire categorie di interesse (es. sport, finanza) e ricevere notifiche sui nuovi investimenti in tali categorie, seguire campagne provenienti da più di 40 portali e creare il tuo portafoglio investimenti personalizzato.",
				INFORMATION: "informativa"
			},
			LOGIN: {
				TITLE: 'Non hai un account?',
				BUTTON: 'Accedi',
			},
			FORGOT: {
				TITLE: 'Password dimenticata?',
				DESC: 'Entra la tua email per resettare la password',
				SUCCESS: 'Ti è stato inviato un messaggio con le istruzioni per recuperare la password'
			},
			RESET_PASSWORD: {
				TITLE: 'Password dimenticata?',
				DESC: 'Entra la tua email per resettare la password',
				SUCCESS: 'Password resettata correttamente',
				BUTTON: 'Imposta nuova password!'
			},
			REGISTER: {
				TITLE: 'Registrati per scoprire tutte le funzionalità di Startups Wallet',
				DESC: 'Inserisci i dettagli per creare l’account',
				SUCCESS: 'Conferma l’email cliccando sul link ricevuto',
				NEWSLETTER: 'Iscriviti alla newsletter',
				ACCEPT_POLICY1: "Ho preso visione dell'",
				ACCEPT_POLICY2: "sul trattamento dei dati personali",
				RECEIVE_NEWSLETTER: "Presto il consenso all’invio della newsletter"
			},
			VERIFY_EMAIL:{
				SUCCESS: 'Email confermata',
				ERROR: 'Link scaduto, invia nuovamente e-mail'
			},
			INPUT: {
				EMAIL: 'Email',
				FULLNAME: 'Nome e cognome',
				FIRSTNAME: 'Nome',
				LASTNAME: 'Cognome',
				PASSWORD: 'Password',
				CONFIRM_PASSWORD: 'Conferma password',
				USERNAME: 'Nome utente',
				PHONE: 'Telefono'
			},
			VALIDATION: {
				INVALID: '{{name}} is not valid',
				REQUIRED: '{{name}} è obbligatorio',
				MIN_LENGTH: '{{name}} minimum length is {{min}}',
				NOT_FOUND: 'The requested {{name}} is not found',
				INVALID_LOGIN: 'Credenziali non corrette',
				REQUIRED_FIELD: 'Campo obbligatorio',
				MIN_LENGTH_FIELD: 'Lunghezza minima:',
				MAX_LENGTH_FIELD: 'Lunghezza massima:',
				INVALID_FIELD: 'Campo non valido',
				ALREADY_EXIST_EMAIL: 'Utente già registrato',
				PASSWORD_NOT_CORRESPOND: 'Le password non corrispondono',
				PASSWORD_MINLENGTH: 'La password deve contenere almeno 3 caratteri',
				FIRSTNAME_MINLENGTH: 'Il nome deve contenere almeno 3 caratteri',
				LASTNAME_MINLENGTH: 'Il cognome deve contenere almeno 3 caratteri',
				FIRSTNAME_REQUIRED: `Il nome è obbligatorio`,
				LASTNAME_REQUIRED: `Il cognome è obbligatorio`,
				EMAIL_REQUIRED: 'L’e-mail è obbligatoria',
				CONFIRM_PASSWORD_REQUIRED: 'La conferma della password è obbligatoria',
				PASSWORD_REQUIRED: 'Password obbligatoria',
				EMAIL_INCORRECT: `L'e-mail non è corretta`,
				EMAIL_CORRECT: 'L’e-mail è corretta',
				EMAIL_MINLENGTH: 'E-mail deve contenere almeno 3 caratteri'
			},
			PASSWORD_STRENGTH: {
				OVERVIEW: 'La password deve contenere almeno :',
				LENGTH: '8 caratteri',
				MAX_LENGTH: 'Massimo 30 caratteri',
				LOWERCASE: 'Una lettera minuscola',
				UPPERCASE: 'Una lettera maiuscola',
				SPECIAL: 'Un carattere speciale',
				SPECIAL_TOOLTIP: `? | ) - (! "£ $% & / = '^;,.: _ * § ° Ç # @`,
				NUMBER: 'Un numero',
				EXAMPLE: 'Ecco alcuni esempi di password valide: Exa0734!  Eng8213?',
			},
		},
		COMMON: {
			TABLE: {
				PAGINATION_INFO: '{start}-{end} di {total}',
				PAGE_SIZE_SELECT: 'Display',
				SELECTED_INFO: 'Selezionate {selected}/{total} righe:',
				DELETE_ALL: 'Elimina tutto',
				DESELECT_ALL: 'Deselezionare tutto',
				CLEAR_FILTER: 'Pulisci filtro',
				COPY: 'Copia',
				CUT: 'Taglia',
				MOVE: 'Sposta',
				SWAL: {
					DELETE: {
						TITLE: 'Sei sicuro di voler eliminare definitivamente gli elementi selezionati?',
						TEXT: `ATTENZIONE: Questa azione è irreversibile!`,
					}
				}
			},
		},
		USER: {
			FOLLOW: {
				TITLE: 'Seleziona fino a 3 categorie in cui sei esperto per un investimento più consapevole',
				BUTTON: 'Fine'
			},
			PROFILE: {
				CAMPAIGNS: {
					NOT_FOLLOWS: 'Non hai ancora seguito nessuna campagna in questa sezione',
					GET_NOTI_FOLLOW_COMPAIGN: "Riceverai una notifica ogni volta che avverrà un evento rilevante delle campagne che segui.",
					CONGIF_NOTI: "Configura notifiche"
				},
				CATEGORIES: {
					NOT_CAMPAIGNS: 'Non ci sono attualmente campagne per questa categoria',
					GET_NOTI_FOLLOW_CATEGORY: "Riceverai una notifica ogni volta che uscirà un nuovo investimento all’interno delle tue categorie prescelte."
				},
				WALLET_CAMPAIGNS: {
					NOT_CAMPAIGNS: 'Non hai ancora nessuna campagna nel portafoglio',
					TOTAL_INVEST: "Totale investito",
					NUMBER_PROJECT: "Numero progetti",
					ADD_INVEST: "Aggiungi investimento",
					REMOVE_COMPAIGN_WALLET: "Rimuovi la campagna dal portafoglio?",
					WALLET_DELETING: "Wallets are deleting...",
					REMOVED_WALLET: "Campagna rimossa dal portafoglio"
				},
				PERSONAL: {
					profile_linked: "Profilo linkedin",
					role: "Ruolo",
					city: "Città",
					current_company: "Azienda attuale",
					member_of: "Membro da",
					DELEETE_ACCOUNT: "Elimina definitivamente il mio account da startupswallet.com"
				}
			}
		},
		CAMPAIGNS: {
			FOLLOW_TOOLTIP: 'Salva la campagna nella pagina personale',
			FOLLOWING_TOOLTIP: 'Rimuovi la campagna dalla pagina personale',
			DEFAULT_CATEGORIES_TOOLTIP: 'Imposta le categorie di default (quelle selezionate dalla tua area personale)',
			FILTER: {
				MINIMUM_INVESTMENT: {
					LESS500: 'Fino a 500 €',
					LESS1000: 'Da 500 a 1.000 €',
					LESS2000: 'Da 1.000 a 2.000 €',
					LESS5000: 'Da 2.000 a 5.000 €',
					MIN5000: 'Più di 5.000 €',
					NOT_DEFINED: 'Non definito'
				},
				PRE_MONEY_EVALUATION: {
					LESS1M: 'Fino a 1 Milioni €',
					LESS3M: 'Da 1 a 3 Milioni €',
					LESS5M: 'Da 3 a 5 Milioni €',
					LESS10M: 'Da 5 a 10 Milioni €',
					MIN10M: 'Più di 10 Milioni €',
					NOT_DEFINED: 'Non definito'
				},
				HOLDING_TIME: {
					LESS6: 'Fino a 6 mesi',
					LESS12: 'Da 6 mesi a 12 mesi',
					LESS18: 'Da 12 mesi a 18mesi',
					LESS24: 'Da 18 mesi a 24 mesi',
					LESS36: 'Da 24 mesi a 36 mesi',
					MIN36: 'Più di 36 mesi',
					NOT_DEFINED: 'Non definito'
				},
				ROI_ANNUAL: {
					LESS5: 'Fino al 5%',
					LESS10: 'Da 5% a 10%',
					MIN10: 'Più del 10%',
					NOT_DEFINED: 'Non definito'
				},
			},
			LIST: {
				NAME: "Nome campagna",
				OBJECT_MIN_MAX: "Obiettivo min-max",
				OBJETC: "Obiettivo",
				INVESTOR: "Investito",
				INV_MINIUM: "Inv. minimo",
				ROI_ANNUAL: "ROI annuo",
				INVEST_DURATION: "Durata investimento",
				COMPAIGN_DURATION: "Durata campagna",
				PLATFORM: "Piattaforma",
				CAPITAL_INCESTED: "Capitale investito",
				NUMBER_INVESTORS: "Numero investitori",
				STATE: "Stato",
				DESCRIPTION: "Descrizione",
				COMPANY_EVAL: "Valutazione azienda",
				COMPANY_NAME: "Nome azienda",
				PLATFORM_NAME: "Nome piattaforma",
				TAGS: "Tags",
				START_DATE: "Start date",
				END_DATE: "End date",
				EQUITY_OWNED: "Equity posseduta"
			}
		},
		NOTIFICATION: {
			GO_PROFILE: 'Clicca qui per andare alla pagina del profilo',
			GO_EMAIL_BOX: `Conferma l'e-mail nella tua casella di posta entro 10 minuti`,
			USER_DELETE_CONFIRM: 'Sei sicuro di voder eliminare tali utenti?',
			USER_DELETE_WAITING: 'Cancellazione in corso',
			USER_DELETE_SUCCESS: 'Utenti cancellati',
			INVALID_TOKEN: 'Il token non è valido',
			ALERT: {
				NEW_CAMPAIGN_FOR_CATEGORY: 'Per la categoria "{{categoryName}}" è disponibile un nuovo investimento!',
				CAMPAIGN_MAX_GOAL_ALMOST_REACHED: `La campagna "{{campaignName}}" ha quasi raggiunto l'obiettivo massimo di raccolta!`,
				CAMPAIGN_MIN_GOAL_REACHED: `La campagna "{{campaignName}}" ha raggiunto l'obiettivo minimo di raccolta!`,
				CAMPAIGN_WILL_CLOSE_IN: 'La campagna "{{campaignName}}" termina a breve!',
				CAMPAIGN_AVAILABLE_FROM: 'La campagna "{{campaignName}}" sarà disponibile tra a breve!',
				CAMPAIGN_AVAILABLE: 'La campagna "{{campaignName}}" è ora in corso!',
				CAMPAIGN_NOW_CLOSED_FUNDED: 'La campagna "{{campaignName}}" è ora chiusa!',
				CAMPAIGN_NOW_CLOSED__NOT_FUNDED: 'La campagna "{{campaignName}}" non è stata finanziata!',
				CAMPAIGN_NEW_INTERVIEW: `Abbiamo realizzato una nuova intervista per la campagna "{{campaignName}}"!`
			},
			follow_categories: "Segui fino a 3 categorie preferite, ogni qual volta che uscirà un nuovo investimento in una di tali  categorie riceverai una notifica",
			new_compaign_quity: "Nuova campagna <strong>equity</strong> in una",
			new_compaign_lending: "Nuova campagna <strong>lending</strong> in una",
			compaign_alerts: "Allarmi campagne",
			maximum_archieved: "Obiettivo massimo quasi raggiunto",
			maximum_tooltip: "Se segui una specifica campagna, ed essa raggiunge quasi l’obiettivo massimo di raccolta verrai notificato. Dopo aver raggiunto l’obiettivo massimo non sarà più possibile investire.",
			minimum_archieved: "Obiettivo minimo raggiunto",
			minimum_tooltip: "Se segui una specifica campagna, ed essa raggiunge quasi l’obiettivo minimo, verrai notificato. Dopo aver raggiunto l’obiettivo minimo la campagna è andata a buon fine, quindi l’eventuale investimento verrà finalizzato",
			compaign_end: "Campagna termina a breve",
			end_tooltip: "Se segui una specifica campagna, ed essa sta per terminare verrai notificato. Una volta terminata la campagna non sarà più possibile investire",
			start_compaign: "Campagna inizia a breve",
			start_tooltip: "Se segui una specifica campagna e vuoi essere tra i primi ad investire, riceverai un reminder",
			status_change: "Cambio stato",
			coming_progress: "“Prossimamente” -> “In corso”",
			coming_progress_tooltip: "Se segui una specifica campagna, quando essa passa dallo stato “prossimamente” allo stato “in corso” verrai notificato",
			progress_closed: "“In corso” → “Chiusa, finanziata”",
			progress_closed_tooltip: "Se segui una specifica campagna, quando essa passa dallo stato “in corso” allo stato “chiusa finanziata” verrai notificato",
			progress_notfound: "“In corso” → “Chiusa, non finanziata”",
			progress_notfound_tooltip: "Se segui una specifica campagna, quando essa passa dallo stato “in corso” allo stato “chiusa, non finanziata” verrai notificato",
			new_inverview: "Nuova intervista",
			updateme_new_interview: "Aggiornami quando esce una nuova intervista",
			updateme_new_interview_tooltip: "Se segui una specifica campagna, quando uscirà una nuova intervista relativa alla campgna verrai notificato"
		},
		GENERAL: {
			HI: 'Ciao',
			NAME: 'Nome',
			FULLNAME: 'Nome e cognome',
			LEARN_MORE: 'Approfondisci',
			SEARCH: 'Ricerca',
			CATEGORY: 'Categoria',
			CATEGORIES: 'Categorie',
			CAMPAIGN: 'Campagna',
			CAMPAIGNS: 'Campagne',
			REALESTATE: 'Real estate',
			DESCRIPTION: 'Descrizione',
			SOURCE: 'Sorgente',
			FILTER: 'Filtra',
			ORDER_BY: 'Ordina per',
			STATUS: 'Stato',
			MINIMUM_INVESTMENT: 'Investimento minimo',
			PRE_MONEY_EVALUATION: 'Valutazione società',
			MOST_FUNDED: 'Più finanziate',
			WITH_MOST_INVESTORS: 'Con più investitori',
			WITH_MOST_ROI: 'ROI più elevato',
			WITH_MOST_ROIANNUAL: 'ROI annuo più elevato',
			EXPIRING: 'In scadenza',
			PRIORITY: 'Priorità',
			LOCATION: 'Luogo',
			FOUND_DATE: 'Data fondazione',
			INVOLVED_OTHER_CAMPAIGNS: 'Campagne della stessa azienda',
			SOCIALS: 'Social',
			CONTACT_WITH_SUPPORT: 'Contattaci',
			START_CHAT: 'Avvia la chat',
			ONGOING: 'In Corso',
			COMINGSOON: 'Prossimamente',
			CLOSED_FUNDED: 'Campagna finanziata',
			CLOSED_NOT_FUNDED: 'Non finanziate',
			REFUNDED: "Rimborsata",
			STARTING: "Iniziando",
			DISCOVER_SIMILAR_CAMPAIGNS: 'Scopri campagne simili',
			FOLLOW: 'Segui',
			FOLLOWING: `Già segui`,
			SHOW_MORE_RESULT: 'Mostra più risultati',
			RESET_FILTERS: 'Azzera filtri',
			ALL_STARTUPS: 'Tutte le startup',
			COMPANY: 'Azienda',
			COMPANY_TYPE: 'Tipologia azienda',
			START_DATE: `Data d'inizio`,
			END_DATE: `Data di fine`,
			EQUITY: 'Equity',
			NO_RECORD_FOUND: 'Nessun risultato trovato',
			KEEP_READING: 'Continua a leggere',
			NO_CAMPAIGN_FOR_FILTER: 'Nessun campagna per tali filtri',
			CATEGORY_SELECTABLE_ERROR: 'Puoi selezionare al massimo 3 categorie',
			CATEGORIES_AND_CAMPAIGNS: 'Categorie e campagne',
			PERSONAL_PAGE: 'Area personale',
			CONFIRM_YOUR_EMAIL: 'Per poter continuare, conferma prima la tua email',
			RESEND_EMAIL: 'Invia nuovamente email',
			SEND_EMAIL: 'Invia e-mail',
			DEFAULt_CATEGORIES: 'Categorie predefinite',
			CLOSE: 'Chiudi',
			OVERFUNDED: 'Finanziato',
			GOAL: 'Goal',
			LOGOUT: 'Esci',
			YES: 'Sì',
			CANCEL: 'Annulla',
			TRY_AGAIN: 'Try again',
			CROWDFUNDING: 'Crowdfunding',
			ADMIN: 'Admin',
			REPORTS: 'Reports',
			SAVE: 'Save',
			COMPANIES: 'Companies',
			ALIASES: 'Aliases',
			OK_GOT_IT: 'Ok, grazie!',
			SOURCES: 'Sources',
			ADVERTISEMENT: 'Advertisement',
			CLOSING: 'In chiusura',
			HOLDING_TIME: 'Durata prestito',
			ANNUAL_RETURN: 'Rendimento annuo',
			TYPOLOGY: 'Tipologia',
			READ_MORE: 'Leggi tutto',
			ALIAS: 'Alias',
			USER: 'User',
			HOME: 'Home',
			NO_ITEM_SELECT: "No items for select"
		},
		USER_MENU: {
			FOLLOW_CATEGORY: "Categorie seguite",
			FOLLOW_PROJECT: "Progetti seguiti",
			WALLET: "Portafoglio",
			NOTIFICATIONS: "Notifiche",
			PERSONAL_DATA: "I tuoi dati personali",
			LANGUAGE: "Language"
		},
		OTHERS: {
			BLOG: "Blog",
			DASHBORAD: "Dashboard",
			Funding: "Funding",
			Campaign: "Campaign",
			Source: "Source",
			Category: "Categorie",
			Location: "Location",
			Region: "Region",
			Analytics: "Analytics",
			User: "User",
			Home: "Home",
			Advertisement: "Advertisement",
			Campaigns: "Campaigns",
			Companies: "Companies",
			Sources: "Sources",
			Aliases: "Aliases",
			user_manage: "User management",
			Users: "Users",
			Roles: "Roles",
			scrap_logs: "Scraping logs",
			backup_scrap_logs: "Backup Scraping logs",

			Italian: "Italian",
			Spanish: "Spanish",
			Franch: "Franch",
			Germany: "Germany",
			English: "English",

			checkout_app: "Scopri la nostra app, trovala su",
			discover_our_interviews: "Scopri le nostre interviste ed i nostri podcast:",
			discover_articles: "Scopri tutti i nostri articoli sul crowdfunding",
			discover_all_features: 'Scopri tutte le funzionalità di startups wallet',			
			subscribe: "Iscriviti",
			privacy: "Privacy policy",

			subscribed_newsletter: "Ora sei iscritto alla newsletter!",

			search_username_email: "Search by username or email",
			addressbook: 'Address Book',
			more: "more",
			Conversations: "Conversations",
			all: "All",
			Active: "Active",
			Inactive: "Inactive",
			say_hi_to: "Say hi to",
			with_wave: "with a wave",
			say_hi: "Say Hi",
			load_more: "load more",
			You: "You",

			"Startupswallet chat message have been received": "Startupswallet chat message have been received",
			"Chat messages have been received": "Chat messages have been received",
			"Chat messages have been received from": "Chat messages have been received from",

			no_notification: "Non è presente nessuna notifica",
			read: "Lette",
			unread: "Da leggere",
			Loading: "Loading",

			linkedin_no_present: "Account linkedin non presente",

			go_home: "Go to homepage",
			About: "About",
			Contact: "Contact",
			Contactus: "Contact Us",

			Equity: "Equity",
			Lending: "Lending",

			compaign_portfolio: "Campagna aggiunta al portafoglio",
			go_personal_data: "vai all’area personale",

			Chart: "Chart",
			Tabella: "Tabella",
			Mappa: "Mappa",
			Cards: "Cards",

			disable_email_noti: "Puoi disabilitare le notifiche tramite email, in tal caso riceverai le notifiche solo sul sito",
			save_changes: "Salva modifiche",
			plz_wait: "Please wait",
			Device: "Device",

			update_personal_data: "Aggiorna le tue informazioni personali in qualsiasi momento.",

			INVESTORS: "investitori",
			DAYS_FINISH: "giorni al termine",
			ROI_YEARLY: "ROI Annuo",
			DURATION: "Durata",
			MONTHS: "mesi",
			OBJECT_MIN: "Obiettivo min",
			OBJECT_MAX: "Obiettivo max",
			BOX_AVAILABLE: "Box disponibile",
			Bye_Run_Buy: "Ciao! Questo box è ancora libero! Corri ad acquistarlo e non perdere l’opportunità di dare visibilità alla tua campagna o piattaforma!",
			REQUEST_INFO: "Richiedi informazioni",
			BUY: "Acquista",
			Capital_raised: "Capitale raccolto",

			CLICK_PIN_VIEW: "Clicca sul pin per visualizzare tutti gli investimenti",

			Aggregatore_Crowdfunding: "Aggregatore Crowdfunding",
			REMOVE_WALLET: "Rimuovi dal portafoglio",
			ADD_PORTFOLIO: "Aggiungi al portafoglio",
			FOLLOW_CATEGORY_FOR_NOTI: "Segui la categoria e riceverai una notifica ogni volta che uscirà un nuovo investimento",
			EQUITY_MIN: "Equity minima",
			EQUITY_MAX: "Equity massima",
			percentage_equity_tooltip: "Percentuale di equity ceduta dall’azienda",
			rang_between2_tootltip: "Intervallo compreso tra 2 e 20%, determinato sulla base dei valori medi delle campagne passate",
			loan: "prestito",
			rang_between6_tootltip: "Intervallo compreso tra 6 e 60%, determinato sulla base dei valori medi delle campagne passate",
			rang_between0_tootltip: "Intervallo compreso tra 0 e 2000€, determinato sulla base dei valori medi delle campagne passate",
			rang_between_milion_tootltip: "Intervallo compreso tra 0 e 20 milioni, determinato sulla base dei valori medi delle campagne passate",
			SEE_ALL_INVEST: "Vedi tutti gli investimenti",
			Crowdfunding: "Crowdfunding",
			postalcode: "Fiscal code",
			tag_original: "Tag originali",
			country: "Nazione",
			YOU_INTERESTED: "Ti potrebbero interessare anche",

			compaign_equity_title: "Investi nell’Equity Crowdfunding",
			compaign_lending_title: "Investi nel lending Crowdfunding",
			company_equity_tooltip: "Investi in aziende diventandone socio",
			company_lending_tooltip: "Prestiti ad aziende con interessi",
			real_estate_equity: "Investi in aziende nel settore immobiliare diventandone socio",
			real_estate_lending: "Prestiti ad aziende (nel settore immobiliare) con interessi",
			minibond: "Prestiti dedicati agli investitori professionali",

			ADD_FILTER: "Aggiungi filtri",
			UNCHECK_ALL: "Deseleziona tutto",
			UPDATE: "AGGIORNA",
			DESELECT: "Deseleziona",
			SELECT_ALL: "Seleziona tutto",

			CLOSED: "chiuso",

			start_title: "Aggregatore di Equity e Lending Crowdfunding Startups Wallet",
			start_desc: "Startups Wallet è una vetrina che raccoglie al suo interno tutti gli investimenti di crowdfunding, equity e lending, attualmente disponibili in startup e PMI anche nel settore immobiliare (real estate).	Startups Wallet aggrega infatti decine di piattaforme di equity e lending crowdfunding.	Investi in aziende diventando azionista di imprese italiane o effettuando prestiti con alti tassi di interesse.	Le piattaforme equity crowdfunding presenti: mamacrowd, crowdfundme, opstart, backtowork, concrete investing, walliance, wearestarting, 200 rowd, the best equity, buildaround, ecomill, crowd investitalia, extra funding, idea crowdfunding, lita, my best invest, next equity, starsup, etc.	Le piattaforme lending crowdfunding presenti: rendimento etico, evenfi, crowd estate, evenfi, relender, trusters, ener2crowd, recrowd, valore condiviso, bridge asset, housers, build lenders, prepay investimenti, business lending, crowd lender, isicrowd, italy crowd, october, profit farm, the social lender, etc.",

			VAT_NUMBER: "Partita iva",

			unsub_title: "Aggregatore Crowdinvesting",
			THANKS_JOINING_US: "Grazie per essere stato dei nostri",
			HOPE_SEE_AGAIN: "Speriamo di rivederti presto",

			homepage_tooltip1: "Investi in Startup, PMI e/o in progetti",
			homepage_tooltip2: "attraverso l’aggregatore di",
			homepage_tooltip3: "crowdfunding dei principali",
			homepage_tooltip4: "portali",

			detail_equity_tooltip1: "Investi in Startup e PMI Italiane tramite l’aggregatore di portali di equity e lending crowdfunding (incluso real estate). Portali presenti su startupswallet.com",
			detail_equity_tooltip2: "regolarmente iscritti alla",
			detail_equity_tooltip3: "Portali equity crowdfunding presenti",
			detail_equity_tooltip4: "e molti altri",
			detail_equity_tooltip5: "",
			detail_lending_tooltip1: "Concedi un prestito a startup e PMI tramite l’aggregatore di tutti i portali di",
			detail_lending_tooltip2: "in cambio di alti tassi di interesse. Usa i filtri e l’ordinamento per trovare i prestiti più vantaggiosi.Portali lending crowdfunding presenti",
			detail_lending_tooltip3: "",
			detail_AnnualTooltip: "puoi filtrare le campagne o ordinare le campagne per ROI Annuo",
			detail_holding: "puoi filtrare le campagne o ordinare le campagne per Durata prestito",
			detail_minimum: "puoi filtrare le campagne o ordinare le campagne per investimento minimo",
			detail_preMoney: "puoi filtrare le campagne per valutazione societaria",
			detail_physical1: "puoi visualizzare gli investimenti tramite la",
			detail_physical2: "modalità mappa",
			front_detail: "Su",
			top_choice: "Top choice",
			FAVORITE_CATEGORY: "categoria preferita",
			SOMETHING_RELATED_CAMPAIGN: "Vuoi segnalarci qualcosa di relativo a questa campagna?",
			REPORT_NEWS: "segnala una notizia",
			ASK_QUESTION: "Vuoi fare una domanda?",
			ASK_EXPERT: "chiedi agli esperti",
			AND: "ed",
			immobiliari: "immobiliari",
			discover_blog: "Scopri le nostre interviste ai fondatori e/o soci di",
			subscribe_email: "Iscriviti alla newsletter",
			unsubscribe_email: "Iscriviti alla newsletter",
			NEWSLETTER: 'Newsletter',
			INSERT_EMAIL: "Il tuo indirizzo email"
		},
		CHART: {
			PER_YEAR: "Per anno",
			PER_CATEGORY: "Per categoria",
			PER_PLATFORM: "Per piattaforma"
		}
	}
};
