import { google } from "@ai-sdk/google";
import { LanguageModel } from "ai";
import dotenv from 'dotenv';

dotenv.config();

type AgentModel = {
    provider: string;
    model: string;
}

export const models = {
    content_researcher: <AgentModel>{
        provider: "google",
        model: process.env.CONTENT_RESEARCHER!
    },
    worksheet_generator: <AgentModel>{
        provider: "google",
        model: process.env.WORKSHEET_GENERATOR!
    },
    code_generator: <AgentModel>{
        provider: "google",
        model: process.env.CODE_GENERATOR!
    },
    doubt_clearance_agent: <AgentModel>{
        provider: "google",
        model: process.env.DOUBT_CLEARANCE!
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