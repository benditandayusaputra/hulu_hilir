import { createServer } from 'node:http';

const port = Number(process.env['PORT'] ?? 4175);
const foreignReply = {
	text: 'Kadar BOD melonjak menjadi 999,9 mg/L di segmen ini.',
	highlightSegments: [4]
};
const validReply = {
	text: 'Air sungai berubah bulan ini. Lihat segmen yang disorot, lalu coba satu tindakan dari daftar yang tersedia.',
	highlightSegments: []
};

function parseBody(raw) {
	try {
		return JSON.parse(raw);
	} catch {
		return {};
	}
}

function replyFor(body) {
	const user = body.messages?.find((message) => message.role === 'user')?.content ?? '';
	const reply = user.includes('"trigger":"status_change"') ? foreignReply : validReply;
	return { choices: [{ message: { role: 'assistant', content: JSON.stringify(reply) } }] };
}

createServer((request, response) => {
	if (request.method !== 'POST') {
		response.writeHead(200, { 'content-type': 'text/plain' });
		response.end('ok');
		return;
	}
	let raw = '';
	request.on('data', (chunk) => {
		raw += chunk;
	});
	request.on('end', () => {
		response.writeHead(200, { 'content-type': 'application/json' });
		response.end(JSON.stringify(replyFor(parseBody(raw))));
	});
}).listen(port);
