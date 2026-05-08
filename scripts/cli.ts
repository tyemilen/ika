import 'dotenv/config';
import { createInterface } from 'node:readline/promises';
import { drizzle } from 'drizzle-orm/node-postgres';

import * as schema from '../db';
import { eq } from 'drizzle-orm';

const rl = createInterface({
	input: process.stdin,
	output: process.stdout,
});

const db = drizzle(process.env.NUXT_DATABASE_URL!, {
	schema,
});

interface Command {
	args: string[];
	execute: (args: string[]) => void;
}

const commands: Record<string, Command> = {
	'list-users': {
		args: ['<offset: 0>', '<limit: 20>'],
		async execute(args) {
			const users = await db.query.users.findMany({
				offset: parseInt(args[0]) || 0,
				limit: parseInt(args[1]) || 20,
			});

			console.log(users);
		},
	},
	'all-pages': {
		args: [],
		async execute(args) {
			const pages = await db.query.pages.findMany({
				limit: 20,
			});

			console.log(pages);
		},
	},
	'set-role': {
		args: ['[user_id]', '[role: admin | moderator | user]'],
		async execute(args) {
			if (!schema.users.role.enumValues.includes(args[1] as any)) {
				console.log('only', schema.users.role.enumValues.join(', '), 'roles are allowed');
				return;
			}

			const user = await db.query.users.findFirst({
				where: (users, { eq }) => eq(users.id, args[0]),
			});

			console.log(user);
			const answer = await rl.question(
				`Change '${user.username}' role from ${user.role} => ${args[1]}? (y/n) `,
			);

			if (answer[0].toLowerCase() != 'y') return console.log('abort');

			const ret = await db
				.update(schema.users)
				.set({ role: args[1] as any })
				.where(eq(schema.users.id, args[0]));

			console.log(ret);
		},
	},
};

async function main() {
	const [, , cmd, ...args] = process.argv;

	const commandNames = Object.keys(commands);

	if (commandNames.includes(cmd)) {
		await commands[cmd].execute(args);
	} else {
		console.log('Available commands:');
		for (const cmdName of commandNames) {
			console.log(cmdName, commands[cmdName].args);
		}
	}

	process.exit(0);
}

main();
