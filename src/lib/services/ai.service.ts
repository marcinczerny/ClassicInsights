import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  AIError,
  APIError,
  AuthenticationError,
  BadRequestError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  ResponseValidationError,
} from "../errors/ai-errors";

/**
 * Parameters for structured response requests
 */
export interface StructuredResponseParams<T extends z.ZodTypeAny> {
  systemPrompt: string;
  userPrompt: string;
  schema: T;
  model?: string;
  params?: Record<string, any>;
}

/**
 * OpenRouter AI Service
 * Handles structured interactions with Large Language Models via OpenRouter API
 */
export class OpenRouterService {
  private apiKey: string;
  private apiBaseUrl: string;
  private defaultModel = "anthropic/claude-3.5-sonnet";

  constructor() {
    // API Key is loaded from environment variables for security
    // Ensure `OPENROUTER_API_KEY` is set in your .env file
    this.apiKey = import.meta.env.OPENROUTER_API_KEY;
    this.apiBaseUrl = "https://openrouter.ai/api/v1";

    if (!this.apiKey) {
      throw new AuthenticationError("OPENROUTER_API_KEY is not set in environment variables.");
    }
  }

  /**
   * Get structured response from AI model
   * @param params Request parameters including prompts, schema, and optional model/params
   * @returns Validated data conforming to the provided schema
   * @throws AIError subclasses on failure
   */
  public async getStructuredResponse<T extends z.ZodTypeAny>({
    systemPrompt,
    userPrompt,
    schema,
    model,
    params,
  }: StructuredResponseParams<T>): Promise<z.infer<T>> {
    const payload = this.buildRequestPayload({ systemPrompt, userPrompt, schema, model, params });
    const response = await this.executeRequest(payload);
    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new ResponseValidationError("Response from AI is empty or missing content.");
    }

    return this.parseAndValidateResponse(schema, content);
  }

  /**
   * Build request payload for OpenRouter API
   * @private
   */
  private buildRequestPayload<T extends z.ZodTypeAny>({
    systemPrompt,
    userPrompt,
    schema,
    model,
    params,
  }: StructuredResponseParams<T>): Record<string, any> {
    const jsonSchema = zodToJsonSchema(schema, {
      $refStrategy: "none", // Use this strategy to avoid $ref issues
    });

    const { $schema, ...rest } = jsonSchema; // Remove top-level $schema if present

    // Add JSON schema to system prompt for better compliance
    const enhancedSystemPrompt = `${systemPrompt}

IMPORTANT: You MUST respond with ONLY valid JSON matching this exact schema. Do not include any explanatory text, markdown formatting, or additional content outside the JSON object.

Required JSON Schema:
${JSON.stringify(rest, null, 2)}`;

    return {
      model: model || this.defaultModel,
      messages: [
        { role: "system", content: enhancedSystemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_object",
      },
      ...params,
    };
  }

  /**
   * Parse and validate AI response against schema
   * @private
   */
  private parseAndValidateResponse<T extends z.ZodTypeAny>(schema: T, content: string): z.infer<T> {
    try {
      const parsedJson = JSON.parse(content);
      const validationResult = schema.safeParse(parsedJson);

      if (!validationResult.success) {
        throw new ResponseValidationError(`AI response validation failed: ${validationResult.error.message}`);
      }
      return validationResult.data;
    } catch (error) {
      if (error instanceof ResponseValidationError) throw error;
      throw new ResponseValidationError(`Failed to parse AI response as JSON. Content: ${content}`);
    }
  }

  /**
   * Execute HTTP request to OpenRouter API
   * @private
   */
  private async executeRequest(body: Record<string, any>): Promise<any> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://classic-insights.com", // Replace with your app's URL
          "X-Title": "Classic Insights", // Replace with your app's name
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const errorMessage = errorBody.error?.message || `API request failed with status ${response.status}`;

        switch (response.status) {
          case 400:
            throw new BadRequestError(errorMessage);
          case 401:
            throw new AuthenticationError(errorMessage);
          case 429:
            throw new RateLimitError(errorMessage);
          case 404:
            throw new NotFoundError(errorMessage);
          default:
            throw new APIError(errorMessage);
        }
      }

      return await response.json();
    } catch (error) {
      if (error instanceof AIError) throw error;
      throw new NetworkError(`Network request to OpenRouter failed: ${(error as Error).message}`);
    }
  }
}
