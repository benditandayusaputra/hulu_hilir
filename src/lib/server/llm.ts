import * as v from 'valibot';

export interface LlmConfig {
	baseUrl: string;
	apiKey: string;
	model: string;
}

export type LlmCall = (system: string, user: string, signal: AbortSignal) => Promise<string>;

const TEMPERATURE = 0.7;
const MAX_TOKENS = 400;
const REASONING_EFFORT = 'low';

const CompletionSchema = v.object({
	choices: v.pipe(
		v.array(v.object({ message: v.object({ content: v.nullable(v.string()) }) })),
		v.minLength(1)
	)
});

export function llmConfigFrom(env: Record<string, string | undefined>): LlmConfig | null {
	const baseUrl = env['AI_LLM_BASE_URL'];
	const apiKey = env['AI_LLM_API_KEY'];
	const model = env['AI_LLM_MODEL'];
	if (!baseUrl || !apiKey || !model) return null;
	return { baseUrl: baseUrl.replace(/\/+$/, ''), apiKey, model };
}

export function createChatCompletion(config: LlmConfig, fetcher: typeof fetch = fetch): LlmCall {
	return async (system, user, signal) => {
		const response = await fetcher(`${config.baseUrl}/chat/completions`, {
			method: 'POST',
			headers: {
				authorization: `Bearer ${config.apiKey}`,
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				model: config.model,
				messages: [
					{ role: 'system', content: system },
					{ role: 'user', content: user }
				],
				response_format: { type: 'json_object' },
				temperature: TEMPERATURE,
				max_tokens: MAX_TOKENS,
				reasoning_effort: REASONING_EFFORT
			}),
			signal
		});
		if (!response.ok) throw new Error(`llm status ${response.status}`);
		const parsed = v.safeParse(CompletionSchema, await response.json());
		const content = parsed.success ? parsed.output.choices[0]?.message.content : null;
		if (content === null || content === undefined) throw new Error('llm content missing');
		return content;
	};
}
