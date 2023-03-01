// Spain
export const locale = {
  lang: 'es',
  data: {
		TRANSLATOR: {
			SELECT: 'seleccione su idioma',
		},
		MENU: {
			NEW: 'nuevo',
			ACTIONS: 'Acciones',
			CREATE_POST: 'Crear nueva publicación',
			PAGES: 'Páginas',
			FEATURES: 'Características',
			APPS: 'Aplicaciones',
			DASHBOARD: 'Tablero',
		},
		AUTH: {
			GENERAL: {
				OR: 'O',
				SUBMIT_BUTTON: 'Enviar',
				NO_ACCOUNT: 'No tiene una cuenta?',
				SIGNUP_BUTTON: 'Registro',
				FORGOT_BUTTON: 'Contraseña olvidada',
				BACK_BUTTON: 'Atrás',
				PRIVACY: 'Privacidad',
				LEGAL: 'Legal',
				CONTACT: 'Contacto',
				WELCOME: 'Agregador de crowdfunding de capital y préstamos',
				DESCRIPTION: "Al registrarse, puede seguir categorías de interés (por ejemplo, deportes, finanzas) y recibir notificaciones sobre nuevas inversiones en estas categorías, seguir campañas de más de 40 portales y crear su propia cartera de inversiones personalizada.",
				INFORMATION: "información"
			},
			LOGIN: {
				TITLE: 'No tiene una cuenta?',
				BUTTON: 'Entrar',
			},
			FORGOT: {
				TITLE: '¿Has olvidado tu contraseña?',
				DESC: 'Acceda a su e-mail para restablecer su contraseña',
				SUCCESS: 'Se le ha enviado un mensaje con instrucciones para recuperar su contraseña'
			},
			RESET_PASSWORD: {
				TITLE: '¿Has olvidado tu contraseña?',
				DESC: 'Acceda a su e-mail para restablecer su contraseña',
				SUCCESS: 'Contraseña restablecida con éxito',
				BUTTON: 'Establece una nueva contraseña!'
			},
			REGISTER: {
				TITLE: 'Regístrese para descubrir todas las funciones de Startups Wallet',
				DESC: 'Introduzca los datos para crear una cuenta',
				SUCCESS: 'Confirme el correo electrónico haciendo clic en el enlace recibido',
				NEWSLETTER: 'Suscríbase al newsletter',
				ACCEPT_POLICY1: "Ha leído la",
				ACCEPT_POLICY2: "sobre el tratamiento de datos personales.",
				RECEIVE_NEWSLETTER: "Doy mi consentimiento para el envío del boletín de noticias"
			},
			VERIFY_EMAIL:{
				SUCCESS: 'Email confirmado',
				ERROR: 'Link caducado, reenviar e-mail'
			},
			INPUT: {
				EMAIL: 'Email',
				FULLNAME: 'Nombre y apellidos',
				FIRSTNAME: 'Nombre',
				LASTNAME: 'Apellidos',
				PASSWORD: 'Password',
				CONFIRM_PASSWORD: 'Confirmación de la contraseña',
				USERNAME: 'Nombre de usuario',
				PHONE: 'Teléfono'
			},
			VALIDATION: {
				INVALID: '{{name}} no es válido',
				REQUIRED: '{{name}} es obligatorio',
				MIN_LENGTH: '{name}} la longitud mínima es {{min}}',
				NOT_FOUND: 'El {{name}} solicitado no se encuentra',
				INVALID_LOGIN: 'Credenciales incorrectas',
				REQUIRED_FIELD: 'Campo obligatorio',
				MIN_LENGTH_FIELD: 'Longitud mínima:',
				MAX_LENGTH_FIELD: 'Longitud máxima:',
				INVALID_FIELD: 'Campo no válido',
				ALREADY_EXIST_EMAIL: 'Usuario ya registrado',
				PASSWORD_NOT_CORRESPOND: 'Las contraseñas no coinciden',
				PASSWORD_MINLENGTH: 'La contraseña debe contener al menos 3 caracteres',
				FIRSTNAME_MINLENGTH: 'El nombre debe contener al menos 3 caracteres',
				LASTNAME_MINLENGTH: 'El apellido debe contener al menos 3 caracteres',
				FIRSTNAME_REQUIRED: `El nombre es obligatorio`,
				LASTNAME_REQUIRED: `El apellido es obligatorio`,
				EMAIL_REQUIRED: 'El e-mail es obligatorio',
				CONFIRM_PASSWORD_REQUIRED: 'La confirmación de la contraseña es obligatoria',
				PASSWORD_REQUIRED: 'Password obbligatoria',
				EMAIL_INCORRECT: `El e-mail es incorrecto`,
				EMAIL_CORRECT: 'El e-mail es correcto',
				EMAIL_MINLENGTH: 'El e-mail debe contener al menos 3 caracteres'
			},
			PASSWORD_STRENGTH: {
				OVERVIEW: 'La contraseña debe contener al menos:',
				LENGTH: '8 caracteres',
				MAX_LENGTH: 'Máximo 30 caracteres',
				LOWERCASE: 'Una letra minúscula',
				UPPERCASE: 'Una letra mayúscula',
				SPECIAL: 'Un carácter especial',
				SPECIAL_TOOLTIP: `? | ) - (! "£ $% & / = '^;,.: _ * § ° Ç # @`,
				NUMBER: 'Un número',
				EXAMPLE: 'Estos son algunos ejemplos de contraseñas válidas: Exa0734!  Eng8213?',
			},
		},
		COMMON: {
			TABLE: {
				PAGINATION_INFO: '{start}-{end} di {total}',
				PAGE_SIZE_SELECT: 'Pantalla',
				SELECTED_INFO: 'Seleccione {selected}/{total} líneas:',
				DELETE_ALL: 'Borrar todo',
				DESELECT_ALL: 'Deseleccionar todo',
				CLEAR_FILTER: 'Limpiador de filtros',
				COPY: 'Copiar',
				CUT: 'Cortar',
				MOVE: 'Mueve',
				SWAL: {
					DELETE: {
						TITLE: '¿Está seguro de que quiere eliminar permanentemente los elementos seleccionados?',
						TEXT: `ADVERTENCIA: ¡Esta acción es irreversible!`,
					}
				}
			},
		},
		USER: {
			FOLLOW: {
				TITLE: 'Seleccione hasta 3 categorías en las que sea experto para invertir con mayor conocimiento de causa',
				BUTTON: 'Fin'
			},
			PROFILE: {
				CAMPAIGNS: {
					NOT_FOLLOWS: 'Todavía no has seguido ninguna campaña en esta sección',
					GET_NOTI_FOLLOW_COMPAIGN: "Recibirás una notificación cada vez que se produzca un evento relevante en las campañas que sigues.",
					CONGIF_NOTI: "Configurar las notificaciones"
				},
				CATEGORIES: {
					NOT_CAMPAIGNS: 'Actualmente no hay campañas para esta categoría',
					GET_NOTI_FOLLOW_CATEGORY: "Recibirá una notificación cada vez que se publique una nueva inversión dentro de las categorías elegidas."
				},
				WALLET_CAMPAIGNS: {
					NOT_CAMPAIGNS: 'Todavía no tiene ninguna campaña en su cartera',
					TOTAL_INVEST: "Total invertido",
					NUMBER_PROJECT: "Número de proyectos",
					ADD_INVEST: "Añadir inversión",
					REMOVE_COMPAIGN_WALLET: "¿Quitar la campaña de la cartera?",
					WALLET_DELETING: "Las carteras borran...",
					REMOVED_WALLET: "Campaña retirada de la cartera"
				},
				PERSONAL: {
					profile_linked: "Perfil de Linkedin",
					role: "Papel",
					city: "Ciudad",
					current_company: "Empresa actual",
					member_of: "Miembro desde",
					DELEETE_ACCOUNT: "Eliminar permanentemente mi cuenta de startupswallet.com"
				}
			}
		},
		CAMPAIGNS: {
			FOLLOW_TOOLTIP: 'Guarda la campaña en tu página personal',
			FOLLOWING_TOOLTIP: 'Eliminar la campaña de la página personal',
			DEFAULT_CATEGORIES_TOOLTIP: 'Establecer categorías por defecto (los seleccionados de su área personal)',
			FILTER: {
				MINIMUM_INVESTMENT: {
					LESS500: 'Hasta 500 €',
					LESS1000: 'De 500 a 1.000 €',
					LESS2000: 'De 1.000 a 2.000 €',
					LESS5000: 'De 2.000 a 5.000 €',
					MIN5000: 'Más de 5.000 €',
					NOT_DEFINED: 'No definido'
				},
				PRE_MONEY_EVALUATION: {
					LESS1M: 'Hasta 1 millón €',
					LESS3M: 'De 1 a 3 Milioni €',
					LESS5M: 'De 3 a 5 Milioni €',
					LESS10M: 'De 5 a 10 Milioni €',
					MIN10M: 'Más de 10 Milioni €',
					NOT_DEFINED: 'No definido'
				},
				HOLDING_TIME: {
					LESS6: 'Hasta 6 mesi',
					LESS12: 'De 6 mesi a 12 mesi',
					LESS18: 'De 12 mesi a 18mesi',
					LESS24: 'De 18 mesi a 24 mesi',
					LESS36: 'De 24 mesi a 36 mesi',
					MIN36: 'Más de 36 mesi',
					NOT_DEFINED: 'Non definito'
				},
				ROI_ANNUAL: {
					LESS5: 'hasta 5%',
					LESS10: 'De 5% a 10%',
					MIN10: 'Más de 10%',
					NOT_DEFINED: 'Non definito'
				},
			},
			LIST: {
				NAME: "Nome campagna",
				OBJECT_MIN_MAX: "Objetivo mínimo-máximo",
				OBJETC: "Objetivo",
				INVESTOR: "Invertido",
				INV_MINIUM: "Inversión mínima",
				ROI_ANNUAL: "ROI anual",
				INVEST_DURATION: "Duración de la inversión ",
				COMPAIGN_DURATION: "Duración de la campaña",
				PLATFORM: "Plataforma",
				CAPITAL_INCESTED: "Capital invertido",
				NUMBER_INVESTORS: "Número de inversores",
				STATE: "Estado",
				DESCRIPTION: "Descripción",
				COMPANY_EVAL: "Evaluación del equipo",
				COMPANY_NAME: "Nombre de la empresa",
				PLATFORM_NAME: "Nombre de la plataforma",
				TAGS: "Etiquetas",
				START_DATE: "Fecha de inicio ",
				END_DATE: "Fecha final ",
				EQUITY_OWNED: "Patrimonio neto mantenido"
			}
		},
		NOTIFICATION: {
			GO_PROFILE: 'Haga clic aquí para ir a la página del perfil',
			GO_EMAIL_BOX: `Confirme el e-mail en su bandeja de entrada en 10 minutos`,
			USER_DELETE_CONFIRM: '¿Estás seguro de que quieres eliminar a esos usuarios?',
			USER_DELETE_WAITING: 'Anulación en curso',
			USER_DELETE_SUCCESS: 'Usuarios eliminados',
			INVALID_TOKEN: 'El token no es válido',
			ALERT: {
				NEW_CAMPAIGN_FOR_CATEGORY: 'Para la categoría "{{categoryName}}"una nueva inversión está disponible!',
				CAMPAIGN_MAX_GOAL_ALMOST_REACHED: `¡La campaña '{{campaignName}}' casi ha alcanzado su objetivo máximo de recaudación!`,
				CAMPAIGN_MIN_GOAL_REACHED: `¡La campaña '{{campaignName}}' ha alcanzado su objetivo mínimo de recaudación!`,
				CAMPAIGN_WILL_CLOSE_IN: 'La campaña "{{campaignName}}" terminará en breve!',
				CAMPAIGN_AVAILABLE_FROM: 'La campaña "{{campaignName}}" estará disponible en breve!',
				CAMPAIGN_AVAILABLE: 'La campaña "{{campaignName}}" ya está en marcha!',
				CAMPAIGN_NOW_CLOSED_FUNDED: 'La campagna "{{campaignName}}" è ora chiusa!La campaña "{{campaignName}}" está cerrada!',
				CAMPAIGN_NOW_CLOSED__NOT_FUNDED: '¡La campaña "{{campaignName}}" no fue financiada!',
				CAMPAIGN_NEW_INTERVIEW: `Hemos realizado una nueva entrevista para la campaña "{{campaignName}}"!`
			},
			follow_categories: "Siga hasta 3 categorías favoritas, cada vez que se publique una nueva inversión en una de estas categorías recibirá una notificación",
			new_compaign_quity: "Nueva campaña <strong>equity</strong> en una",
			new_compaign_lending: "Nueva campaña <strong>lending</strong> en una",
			compaign_alerts: "Alertas de campaña",
			maximum_archieved: "Objetivo máximo casi alcanzado",
			maximum_tooltip: "Si sigues una campaña específica y ésta casi alcanza el objetivo de recaudación máxima, recibirás una notificación. Una vez alcanzado el objetivo máximo, ya no podrá invertir.",
			minimum_archieved: "Objetivo mínimo alcanzado",
			minimum_tooltip: "Si sigues una campaña específica y ésta casi alcanza el objetivo mínimo, recibirás una notificación. Una vez alcanzado el objetivo mínimo, la campaña es un éxito, por lo que cualquier inversión se concretará",
			compaign_end: "La campaña termina pronto",
			end_tooltip: "SSi sigues una campaña específica y está a punto de terminar, recibirás una notificación. Una vez finalizada la campaña, ya no podrá invertir",
			start_compaign: "La campaña comienza pronto",
			start_tooltip: "Si sigue una campaña concreta y quiere ser de los primeros en invertir, recibirá un recordatorio",
			status_change: "Cambio de estatus",
			coming_progress: "“Próximamente” -> “En curso”",
			coming_progress_tooltip: 'Si sigue una campaña concreta, cuando ésta pase del estado "próximamente" al estado "en curso", recibirá una notificación',
			progress_closed: "“En curso” → “Cerrado, financiado”",
			progress_closed_tooltip: 'Si sigue una campaña concreta, cuando pase del estado "en curso" a "cerrada financiada" recibirá una notificación',
			progress_notfound: "“En curso” → “Cerrado, non finanziatano financiado”",
			progress_notfound_tooltip: 'Si sigue una campaña concreta, cuando pase del estado "en marcha" al estado "cerrado, sin financiación", recibirá una notificación',
			new_inverview: "Nueva entrevista",
			updateme_new_interview: "Avísame cuando salga una nueva entrevista",
			updateme_new_interview_tooltip: "Si sigue una campaña específica, recibirá una notificación cuando se publique una nueva entrevista relacionada con la campaña"
		},
		GENERAL: {
			HI: 'Hola',
			NAME: 'Nombre',
			FULLNAME: 'Nombre  y apellidos',
			LEARN_MORE: 'Más información',
			SEARCH: 'Buscar en',
			CATEGORY: 'Categoría',
			CATEGORIES: 'Categorías',
			CAMPAIGN: 'Campaña',
			CAMPAIGNS: 'Campañas',
			REALESTATE: 'Inmobiliario',
			DESCRIPTION: 'Descripción',
			SOURCE: 'Fuente',
			FILTER: 'Filtrar',
			ORDER_BY: 'Ordenar por',
			STATUS: 'Estado',
			MINIMUM_INVESTMENT: 'Inversión mínima',
			PRE_MONEY_EVALUATION: 'Valoración de la empresa',
			MOST_FUNDED: 'Más fondos',
			WITH_MOST_INVESTORS: 'Con más inversores',
			WITH_MOST_ROI: ' ROI más alto',
			WITH_MOST_ROIANNUAL: 'Mayor ROI anual',
			EXPIRING: 'Al vencimiento',
			PRIORITY: 'Prioridades',
			LOCATION: 'Lugar',
			FOUND_DATE: 'Fecha de fundación',
			INVOLVED_OTHER_CAMPAIGNS: 'Campañas de la misma empresa',
			SOCIALS: 'Redes Sociales',
			CONTACT_WITH_SUPPORT: 'Contáctenos',
			START_CHAT: 'Iniciar chat',
			ONGOING: 'En Curso',
			COMINGSOON: 'Próximamente',
			CLOSED_FUNDED: 'Financiado',
			CLOSED_NOT_FUNDED: 'No financiadas',
			REFUNDED: "Reembolsado",
			STARTING: "Inicio",
			DISCOVER_SIMILAR_CAMPAIGNS: 'Descubra campañas similares',
			FOLLOW: 'Siga',
			FOLLOWING: `Ya sigue`,
			SHOW_MORE_RESULT: 'Mostra più risultati',
			RESET_FILTERS: 'Restablecer filtros',
			ALL_STARTUPS: 'Todas las start-ups',
			COMPANY: 'Empresa',
			COMPANY_TYPE: 'Tipo de empresa',
			START_DATE: `Fecha de inicio`,
			END_DATE: `Fecha de finalización`,
			EQUITY: 'Capital',
			NO_RECORD_FOUND: 'No se han encontrado resultados',
			KEEP_READING: 'Seguir leyendo',
			NO_CAMPAIGN_FOR_FILTER: 'No hay campaña para estos filtros',
			CATEGORY_SELECTABLE_ERROR: 'Puede seleccionar un máximo de 3 categorías',
			CATEGORIES_AND_CAMPAIGNS: 'Categorías y campañas',
			PERSONAL_PAGE: 'Área personal',
			CONFIRM_YOUR_EMAIL: 'Para continuar, confirme primero su correo electrónico',
			RESEND_EMAIL: 'Volver a enviar un e-mail',
			SEND_EMAIL: 'Enviar e-mail',
			DEFAULt_CATEGORIES: 'Categorie predefinite',
			CLOSE: 'Cerrar',
			OVERFUNDED: 'Financiado',
			GOAL: 'Objetivo',
			LOGOUT: 'Salida',
			YES: 'Sì',
			CANCEL: 'Cancelar',
			TRY_AGAIN: 'Inténtalo de nuevo',
			CROWDFUNDING: 'Crowdfunding',
			ADMIN: 'Administración',
			REPORTS: 'Reportes',
			SAVE: 'Guardar',
			COMPANIES: 'Empresas',
			ALIASES: 'Aliases',
			OK_GOT_IT: 'Bien, ¡gracias!',
			SOURCES: 'Fuentes',
			ADVERTISEMENT: 'Publicidad',
			CLOSING: 'Cerrar',
			HOLDING_TIME: 'Duración del préstamo',
			ANNUAL_RETURN: 'Rendimiento anual',
			TYPOLOGY: 'Tipo',
			READ_MORE: 'Leer más',
			ALIAS: 'Alias',
			USER: 'Usuario',
			HOME: 'Inicio',
			NO_ITEM_SELECT: "No hay artículos para seleccionar"
		},
		USER_MENU: {
			FOLLOW_CATEGORY: "Categorías seguidas",
			FOLLOW_PROJECT: "Proyectos seguidos",
			WALLET: "Cartera",
			NOTIFICATIONS: "Notificaciones",
			PERSONAL_DATA: "Sus datos personales",
			LANGUAGE: "Idioma"
		},
		OTHERS: {
			BLOG: "Blog",
			DASHBORAD: "Panel de Control",
			Funding: "Funding",
			Campaign: "Campaña",
			Source: "Fuente",
			Category: "Categoría",
			Location: "Localización",
			Region: "Region",
			Analytics: "Analytics",
			User: "Usuario",
			Home: "Inicio",
			Advertisement: "Publicidad",
			Campaigns: "Campañas",
			Companies: "Empresas",
			Sources: "Fuentes",
			Aliases: "Aliases",
			user_manage: "Gestión de usuarios",
			Users: "Usuarios",
			Roles: "Roles",
			scrap_logs: "Registros de raspado",
			backup_scrap_logs: "Copia de seguridad de los registros de raspado",

			Italian: "Italiano",
			Spanish: "Español",
			Franch: "Francés",
			Germany: "Alemán",
			English: "Inglés",

			checkout_app: "Descubra nuestra aplicación en",
			discover_our_interviews: "Descubra nuestras entrevistas y podcasts:",
			discover_articles: "Ver todos nuestros artículos sobre crowdfunding",
			discover_all_features: 'Descubre todas las características de startups wallet',			
			subscribe: "Inscríbete",
			privacy: "Política de privacidad",

			subscribed_newsletter: "Ya estás suscrito al boletín de noticias!",

			search_username_email: "Buscar por nombre de usuario o e-mail",
			addressbook: 'Agenda de direcciones',
			more: "más",
			Conversations: "Conversaciones",
			all: "Todo",
			Active: "Activo",
			Inactive: "Inactivo",
			say_hi_to: "Saluda a",
			with_wave: "con una ola",
			say_hi: "Saluda",
			load_more: "Cargar más",
			You: "Usted",

			"Startupswallet chat message have been received": "Se han recibido mensajes de chat de Startupswallet",
			"Chat messages have been received": "Se han recibido mensajes de chat",
			"Chat messages have been received from": "Se han recibido mensajes de chat de",

			no_notification: "No hay notificación",
			read: "Leídas",
			unread: "De leer",
			Loading: "Caricamento",

			linkedin_no_present: "Cuenta LinkedIn non presente",

			go_home: "Ir a la página de inicio",
			About: "Sobre nosotros",
			Contact: "Contacto",
			Contactus: "Contacto con nosotros",

			Equity: "Capital",
			Lending: "Lending",

			compaign_portfolio: "Campaña añadida a la cartera",
			go_personal_data: "Ir al área personal",

			Chart: "Gráfico",
			Tabella: "Cuadro",
			Mappa: "Mapa",
			Cards: "Tarjetas ",

			disable_email_noti: "Puede desactivar las notificaciones por correo electrónico, en cuyo caso sólo recibirá notificaciones en el sitio",
			save_changes: "Guardar los cambios",
			plz_wait: "Por favor espere",
			Device: "Dispositivo",

			update_personal_data: "Actualice su información personal en cualquier momento.",

			INVESTORS: "inversores",
			DAYS_FINISH: "Días hasta el final",
			ROI_YEARLY: "ROI anual",
			DURATION: "Duración",
			MONTHS: "Meses",
			OBJECT_MIN: "Objetivo mínimo",
			OBJECT_MAX: "Objetivo máximo ",
			BOX_AVAILABLE: "Caja disponible",
			Bye_Run_Buy: "¡Hola! Esta caja sigue siendo gratuita. Date prisa en comprarlo y no pierdas la oportunidad de dar visibilidad a tu campaña o plataforma.",
			REQUEST_INFO: "Richiedi informazioni",
			BUY: "Comprar",
			Capital_raised: "Capital cosechado",

			CLICK_PIN_VIEW: "Haga clic en la chincheta para ver todas las inversiones",

			Aggregatore_Crowdfunding: "Agregador de Crowdfunding",
			REMOVE_WALLET: "Retirar de la cartera",
			ADD_PORTFOLIO: "Añadir a la cartera",
			FOLLOW_CATEGORY_FOR_NOTI: "Siga la categoría y recibirá una notificación cada vez que se publique una nueva inversión",
			EQUITY_MIN: "Patrimonio mínimo",
			EQUITY_MAX: "Máximo patrimonio",
			percentage_equity_tooltip: "Porcentaje de fondos propios vendidos por la empresa",
			rang_between2_tootltip: "Rango entre el 2 y el 20%, determinado sobre la base de los valores medios de las campañas anteriores",
			loan: "préstamo",
			rang_between6_tootltip: "Rango entre el 6 y el 60%, determinado sobre la base de los valores medios de las campañas anteriores",
			rang_between0_tootltip: "Rango entre 0 y 2000€, determinado sobre la base de los valores medios de las campañas anteriores",
			rang_between_milion_tootltip: "Rango entre 0 y 20 millones, determinado sobre la base de los valores medios de las campañas anteriores",
			SEE_ALL_INVEST: "Ver todas las inversiones",
			Crowdfunding: "Crowdfunding",
			postalcode: "Código fiscal",
			tag_original: "Etiqueta original",
			country: "Nación",
			YOU_INTERESTED: "También puede interesarle",

			compaign_equity_title: "Invertir en Equity Crowdfunding",
			compaign_lending_title: "Invertir en Lending Crowdfunding",
			company_equity_tooltip: "Invertir en empresas convirtiéndose en socio",
			company_lending_tooltip: "Préstamos a empresas con intereses",
			real_estate_equity: "Invierta en empresas del sector inmobiliario convirtiéndose en socio",
			real_estate_lending: "Préstamos a empresas (en el sector inmobiliario) con intereses",
			minibond: "Préstamos dedicados a los inversores profesionales",

			ADD_FILTER: "Añadir filtros",
			UNCHECK_ALL: "Deseleccionar todo",
			UPDATE: "ACTUALIZACIÓN",
			DESELECT: "Deseleccionar",
			SELECT_ALL: "Seleziona tutto",

			CLOSED: "cerrado",

			start_title: "Agregador de fondos de capital y préstamos Crowdfunding Startups Wallet",
			start_desc: "Startups Wallet es un escaparate que reúne todas las inversiones de crowdfunding, de capital y de préstamos disponibles actualmente en las empresas de nueva creación y en las PYME, incluso en el sector inmobiliario (bienes raíces).	Startups Wallet agrega docenas de plataformas de financiación colectiva de acciones y préstamos.	Invierta en empresas convirtiéndose en accionista de empresas italianas o prestando a altos tipos de interés. Las plataformas de equity crowdfunding presentan: mamacrowd, crowdfundme, opstart, backtowork, concrete investing, walliance, wearestarting, 200 rowd, the best equity, buildaround, ecomill, crowd investitalia, extra funding, idea crowdfunding, lita, my best invest, next equity, starsup, etc.	Las plataformas de crowdfunding de préstamos presentes: ethical yield, evenfi, crowd estate, evenfi, relender, trusters, ener2crowd, recrowd, shared value, bridge asset, housers, build lenders, prepay investimenti, business lending, crowd lender, isicrowd, italy crowd, october, profit farm, the social lender, etc",

			VAT_NUMBER: "Número de IVA",

			unsub_title: "Agregador de Crowdinvesting",
			THANKS_JOINING_US: "Gracias por estar con nosotros",
			HOPE_SEE_AGAIN: "Esperamos volver a verle pronto",

			homepage_tooltip1: "Invertir en start-ups, PYMEs y/o proyectos",
			homepage_tooltip2: "a través del agregador de",
			homepage_tooltip3: "crowdfunding de los principales",
			homepage_tooltip4: "“portales",

			detail_equity_tooltip1: 'Investir en startup y PMES españolas través del agregador de“portales de equity y lending crowdfunding (incluyendo real estate). Los portales presentes en startupswallet.com',
			detail_equity_tooltip2: "suscrito regularmente",
			detail_equity_tooltip3: "Los portales de equity crowdfunding están presentes",
			detail_equity_tooltip4: "y muchos otros",
			detail_equity_tooltip5: '',
			detail_lending_tooltip1: "Preste a las nuevas empresas y a las PYME a través del agregador de todos los portales de",
			detail_lending_tooltip2: 'a cambio de altos tipos de interés. Utiliza los filtros y la clasificación para encontrar los préstamos más ventajosos.Los portales de crowdfunding de préstamos presentan',
			detail_lending_tooltip3: '',
			detail_AnnualTooltip: "puede filtrar las campañas u ordenarlas por ROI anual",
			detail_holding: "puede filtrar las campañas o clasificarlas por duración del préstamo",
			detail_minimum: "puede filtrar las campañas u ordenarlas por inversión mínima",
			detail_preMoney: "puede filtrar las campañas por valoración de la empresa",
			detail_physical1: "puede ver las inversiones por",
			detail_physical2: "modo mapa",
			front_detail: "En",
			top_choice: "Selección",
			FAVORITE_CATEGORY: "categoria preferita",
			SOMETHING_RELATED_CAMPAIGN: "¿Quieres informar de algo sobre esta campaña?",
			REPORT_NEWS: "reportar una información",
			ASK_QUESTION: "¿Necesita información?",
			ASK_EXPERT: "pregunte a los expertos",
			AND: "y",
			immobiliari: "inmobiliario",
			discover_blog: "Descubre nuestras entrevistas a los fundadores y/o miembros de",
			subscribe_email: "Suscribirse a las cadenas de mails",
			unsubscribe_email: "Suscribirse a las cadenas de mails",
			NEWSLETTER: 'Newsletter',
			INSERT_EMAIL: "Tu correo electrónico"
		},
		CHART: {
			PER_YEAR: "Por año",
			PER_CATEGORY: "Por categoría",
			PER_PLATFORM: "Por plateforma"
		}
	}
};