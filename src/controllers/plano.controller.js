import trilha from '../data/trilha.json' with { type: 'json' };
import Groq from "groq-sdk";
import {Avaliacao_diagnostica} from "../models/avaliacao.model.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const listar = async (req, res) => {
  res.status(501).json({ erro: "Ainda não implementado: listar" });
};

export const gerarDiagnostica = async (req, res) => {
  res.status(501).json({ erro: "Ainda não implementado: gerarDiagnostica" });
};

export const gerarProgresso = async (req, res) => {
  res.status(501).json({ erro: "Ainda não implementado: gerarProgresso" });
};

export const enviarDiagnostica = async (req, res) => {
  res.status(501).json({ erro: "Ainda não implementado: enviarDiagnostica" });
};

export const enviarProgresso = async (req, res) => {
  res.status(501).json({ erro: "Ainda não implementado: enviarProgresso" });
};