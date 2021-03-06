export default {
	nickname: {
		prompt: "What do you want to be called?",
		answer: ".*",
		timeout: 45000,
	},
	gulagQuestions: [
		{
			prompt:
				"Have you ever owned a business or otherwise supported a free market economy? (yes/no)",
			answer: "^no?$",
			strict: true,
			timeout: 30000,
		},
		{
			prompt:
				"Are you willing to do anything the government or your waifu/husbando asks of you, even risking life and limb? (yes/no)",
			answer: "^y[ae]*(s|h)?!*$",
			strict: true,
			timeout: 30000,
		},
		{
			prompt:
				"Repeat after me:\n>>> I pledge my heart and soul to the gulag and my fellow comrade. Long live the supreme anime leader!",
			answer:
				"I pledge my heart and soul to the gulag and my fellow comrade. Long live the supreme anime leader!",
			strict: false,
			timeout: 180000,
		},
	],
	republicQuestions: [
		{
			prompt:
				"Have you ever joined a union or otherwise opposed a free market economy? (yes/no)",
			answer: "^no?$",
			strict: true,
			timeout: 30000,
		},
		{
			prompt:
				"Are you willing to do anything the government pays you to do, even risking life and limb? (yes/no)",
			answer: "^y[ae]*(s|h)?!*$",
			strict: true,
			timeout: 30000,
		},
		{
			prompt:
				"Repeat after me:\n>>> I pledge my heart and soul to this great nation and to the pursuit of money. May the president prosper!",
			answer:
				"I pledge my heart and soul to this great nation and to the pursuit of money. May the president prosper!",
			strict: false,
			timeout: 180000,
		},
	],
};
