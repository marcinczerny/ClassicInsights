# OpenRouter Service Implementation Plan

## 1. Service Description

The `OpenRouterService` will act as a dedicated client for interacting with the OpenRouter.ai API. Its primary responsibility is to abstract the complexity of making API calls for chat completions. It will handle request construction, structured response parsing using Zod schemas, robust error handling, and secure management of API credentials. This service will be the single point of interaction for any feature within the application that needs to leverage Large Language Models.

## 2. Constructor Description

The service will be instantiated without any arguments. It will be responsible for initializing its configuration, primarily loading the OpenRouter API key from environment variables.

```typescript
// src/lib/services/ai.service.ts

export class OpenRouterService {
  private apiKey: string;
  private apiBaseUrl: string;

  constructor() {
    // API Key is loaded from environment variables for security.
    // Ensure `OPENROUTER_API_KEY` is set in your .env file.
    this.apiKey = import.meta.env.OPENROUTER_API_KEY;
    this.apiBaseUrl = 'https://openrouter.ai/api/v1';

    if (!this.apiKey) {
      // Throw an error during initialization if the key is missing.
      throw new Error("OPENROUTER_API_KEY is not set in environment variables.");
    }
  }

  // ... methods
}
```

## 3. Public Methods and Fields

### `async getStructuredResponse<T extends z.ZodTypeAny>(params: StructuredResponseParams<T>): Promise<z.infer<T>>`

This is the primary method for interacting with the LLM when a structured JSON output is required.

-   **`params`**: An object containing all necessary information for the API call.
    -   `systemPrompt` (string): The system-level instruction for the model.
    -   `userPrompt` (string): The user's query or input.
    -   `schema` (Zod schema): The Zod schema that defines the desired JSON output structure.
    -   `model` (string, optional): The name of the model to use (e.g., `'anthropic/claude-3.5-sonnet'`). Defaults to a sensible value.
    -   `params` (object, optional): Additional model parameters like `temperature`, `max_tokens`.
-   **Returns**: A promise that resolves to an object conforming to the provided Zod schema.
-   **Throws**: Custom errors (`APIError`, `ValidationError`, etc.) on failure.

**Example Usage:**

```typescript
import { z } from 'zod';
import { OpenRouterService } from './ai.service'; // Adjust path

const aiService = new OpenRouterService();

const NoteEntitiesSchema = z.object({
  entities: z.array(z.object({
    name: z.string().describe("The name of the identified entity"),
    type: z.enum(["person", "place", "organization", "concept"]).describe("The type of the entity"),
  })).describe("A list of entities found in the note.")
});

try {
  const result = await aiService.getStructuredResponse({
    systemPrompt: "You are an expert at identifying named entities in text. Extract them according to the provided JSON schema.",
    userPrompt: "John Doe visited Paris to meet with representatives from OpenAI.",
    schema: NoteEntitiesSchema,
    model: 'anthropic/claude-3.5-sonnet'
  });
  console.log(result.entities);
  // Output: [{ name: "John Doe", type: "person" }, { name: "Paris", type: "place" }, { name: "OpenAI", type: "organization" }]
} catch (error) {
  console.error("AI service failed:", error.message);
}
```

## 4. Private Methods and Fields

### `private async executeRequest(body: Record<string, any>): Promise<any>`

-   Handles the actual `fetch` call to the OpenRouter API.
-   Adds the required `Authorization`, `Content-Type`, and other necessary headers.
-   Manages network-level errors and timeouts.
-   Parses the initial JSON response and checks for API-level errors before returning the body.

### `private buildRequestPayload<T extends z.ZodTypeAny>(params: StructuredResponseParams<T>): Record<string, any>`

-   Constructs the complete request body for the API call.
-   Transforms the Zod schema into the `json_schema` format required by the OpenRouter API using the `zod-to-json-schema` library.
-   Formats the `systemPrompt` and `userPrompt` into the correct `messages` array structure.
-   Merges default model parameters with any user-provided overrides.

### `private parseAndValidateResponse<T extends z.ZodTypeAny>(schema: T, response: any): z.infer<T>`

-   Takes the raw response content from the API and the original Zod schema.
-   Attempts to parse the string content into a JavaScript object.
-   Uses the Zod schema's `.safeParse()` method to validate the object's structure.
-   Returns the validated data or throws a `ResponseValidationError` if parsing or validation fails.

## 5. Error Handling

The service will implement a robust error handling strategy using custom error classes to provide clear and actionable feedback. All custom errors should extend a base `AIError` class.

-   `AuthenticationError (401)`: Thrown if the API key is invalid or missing.
-   `BadRequestError (400)`: Thrown for malformed requests (e.g., invalid model parameters).
-   `RateLimitError (429)`: Thrown when the API rate limit is exceeded. The application should handle this with a backoff strategy.
-   `NotFoundError (404)`: Thrown if the requested model is not found.
-   `APIError (5xx)`: A generic error for server-side issues on OpenRouter's end.
-   `NetworkError`: Thrown for network connectivity issues or timeouts.
-   `ResponseValidationError`: Thrown if the model's output is not valid JSON or does not conform to the requested Zod schema.

## 6. Security Considerations

1.  **API Key Management**: The `OPENROUTER_API_KEY` must **never** be hardcoded. It will be managed exclusively through environment variables. Use `.env` for local development and the hosting provider's secret management system (e.g., DigitalOcean App Platform secrets) for production.
2.  **Input Sanitization**: While the service itself doesn't directly sanitize input, the calling code should ensure that no sensitive user data (passwords, PII) is inadvertently sent in prompts unless strictly necessary for the feature.
3.  **Dependency Management**: Keep dependencies, especially `zod` and `zod-to-json-schema`, updated to patch any potential security vulnerabilities. Use `npm audit` regularly.
4.  **Least Privilege**: The OpenRouter API key should be configured with the minimum required permissions.

## 7. Step-by-Step Implementation Plan

### Step 1: Project Setup

1.  **Install Dependencies**: Add the `zod-to-json-schema` library to the project.
    ```bash
    npm install zod-to-json-schema
    ```
2.  **Environment Variables**: Create or update the `.env` file in the project root and add your OpenRouter API key.
    ```ini
    # .env
    OPENROUTER_API_KEY="your-secret-api-key"
    ```
3.  **Add to `.gitignore`**: Ensure `.env` is listed in your `.gitignore` file to prevent committing secrets.

### Step 2: Create Custom Error Types

1.  Create a new file `src/lib/errors/ai-errors.ts` to define the custom errors.

```typescript
// src/lib/errors/ai-errors.ts
export class AIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class AuthenticationError extends AIError {}
export class BadRequestError extends AIError {}
export class RateLimitError extends AIError {}
export class NotFoundError extends AIError {}
export class APIError extends AIError {}
export class NetworkError extends AIError {}
export class ResponseValidationError extends AIError {}
```

### Step 3: Implement the `OpenRouterService`

1.  Create the service file at `src/lib/services/ai.service.ts`.
2.  Start with the constructor and basic structure.
3.  Implement the `private executeRequest` method to handle the `fetch` call and basic response/error mapping based on HTTP status codes.
4.  Implement the `private buildRequestPayload` method. This is where you will use `zod-to-json-schema` to convert the Zod schema into the required `response_format` object.
5.  Implement the `private parseAndValidateResponse` method to safely parse and validate the model's output against the schema.
6.  Finally, implement the public `getStructuredResponse` method, which orchestrates the calls to the private methods.

```typescript
// src/lib/services/ai.service.ts

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

// Define the type for the public method's parameters
export interface StructuredResponseParams<T extends z.ZodTypeAny> {
  systemPrompt: string;
  userPrompt: string;
  schema: T;
  model?: string;
  params?: Record<string, any>;
}

export class OpenRouterService {
  private apiKey: string;
  private apiBaseUrl: string;
  private defaultModel = 'anthropic/claude-3.5-sonnet';

  constructor() {
    this.apiKey = import.meta.env.OPENROUTER_API_KEY;
    this.apiBaseUrl = 'https://openrouter.ai/api/v1';

    if (!this.apiKey) {
      throw new AuthenticationError("OPENROUTER_API_KEY is not set in environment variables.");
    }
  }

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

  private buildRequestPayload<T extends z.ZodTypeAny>({
    systemPrompt,
    userPrompt,
    schema,
    model,
    params,
  }: StructuredResponseParams<T>): Record<string, any> {
    const jsonSchema = zodToJsonSchema(schema, {
      $refStrategy: 'none' // Use this strategy to avoid $ref issues
    });

    const { $schema, ...rest } = jsonSchema; // Remove top-level $schema if present

    return {
      model: model || this.defaultModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "get_structured_response",
          strict: true,
          schema: rest,
        },
      },
      ...params,
    };
  }
  
  private parseAndValidateResponse<T extends z.ZodTypeAny>(
    schema: T,
    content: string
  ): z.infer<T> {
    try {
      const parsedJson = JSON.parse(content);
      const validationResult = schema.safeParse(parsedJson);

      if (!validationResult.success) {
        throw new ResponseValidationError(
          `AI response validation failed: ${validationResult.error.message}`
        );
      }
      return validationResult.data;
    } catch (error) {
      if (error instanceof ResponseValidationError) throw error;
      throw new ResponseValidationError(`Failed to parse AI response as JSON. Content: ${content}`);
    }
  }

  private async executeRequest(body: Record<string, any>): Promise<any> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://classic-insights.com', // Replace with your app's URL
          'X-Title': 'Classic Insights', // Replace with your app's name
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const errorMessage = errorBody.error?.message || `API request failed with status ${response.status}`;

        switch (response.status) {
          case 400: throw new BadRequestError(errorMessage);
          case 401: throw new AuthenticationError(errorMessage);
          case 429: throw new RateLimitError(errorMessage);
          case 404: throw new NotFoundError(errorMessage);
          default: throw new APIError(errorMessage);
        }
      }

      return await response.json();
    } catch (error) {
        if (error instanceof AIError) throw error;
        throw new NetworkError(`Network request to OpenRouter failed: ${(error as Error).message}`);
    }
  }
}
```

### Step 4: Integration and Usage

1.  **Instantiate the Service**: In the part of your application where you need AI capabilities (e.g., in an Astro API route or a server-side component helper), create an instance of the `OpenRouterService`.
2.  **Define Zod Schemas**: For each specific use case, define a clear Zod schema for the expected output.
3.  **Call the Service**: Use the `getStructuredResponse` method with your prompts and schema, wrapping the call in a try-catch block to handle potential errors gracefully.
4.  **Refine Prompts**: Test and refine your system and user prompts to get the most accurate and reliable structured data from the models.

