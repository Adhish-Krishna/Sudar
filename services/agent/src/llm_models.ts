import { google } from "@ai-sdk/google";
import { LanguageModel } from "ai";
import dotenv from 'dotenv';

dotenv.config();

type AgentModel = {
    provider: string;
    model: string;
}

export const models = {
    code_evaluator: <AgentModel>{
        provider: "google",
        model: "gemini-2.5-flash"
    },
    content_researcher: <AgentModel>{
        provider: "google",
        model: "gemini-2.0-flash"
    },
    worksheet_generator: <AgentModel>{
        provider: "google",
        model: "gemini-2.5-flash"
    },
    code_generator: <AgentModel>{
        provider: "google",
        model: "gemini-2.5-pro"
    },
    code_refinement_agent: <AgentModel>{
        provider: "google",
        model: "gemini-2.5-flash"
    },
    doubt_clearance_agent: <AgentModel>{
        provider: "google",
        model: "gemini-2.0-flash"
    }
}

const provider_map = new Map<string, (model: string) => any>([
    ["google", (model: string) => google(model)]
]);

export function get_model(provider: string, model: string): LanguageModel {
    const fn = provider_map.get(provider);
    if (!fn) {
        throw new Error(`Unsupported provider: ${provider}`);
    }
    return fn(model)
}