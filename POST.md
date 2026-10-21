---
title: Sloth Hour: a bedtime story and soundscape that run entirely on your laptop
published: false
tags: devchallenge, hf26challenge
---

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 3: Slow and Steady](https://dev.to/challenges/hacktoberfest-week3-2026-10-19)*

## What I Built
Sloth Hour is a wind-down companion. Pick a theme, press one button, and a local open-weight model writes a calm bedtime story while rain, ocean, wind or a low hum plays. The story can be read aloud slowly, and a sleep timer fades everything out so you never have to touch your phone again. The effort it saves: no scrolling for something to listen to, no turning the sound off at 2 a.m.

## Demo
LIVE LINK HERE (the hosted page shows a sample story until you connect your own Ollama; see the README)

## Code
GITHUB REPO LINK HERE

## How I Built It
- **Model:** llama3.2 running locally through Ollama, streamed from `/api/generate`. The model dropdown is filled from whatever you have installed.
- **Sound:** generated live with the Web Audio API (filtered noise and slow oscillators), so there are no audio files.
- **Voice:** the browser's built-in speech synthesis, read slowly.
- **Frontend:** plain HTML, CSS and JavaScript. No framework and no build step. It is installable and works offline as a PWA.
- **Fallback:** if Ollama isn't found, a built-in sample story plays so the page never looks broken.

## Why Does Open Innovation Matter?
A bedtime tool should work with the Wi-Fi off and should not send anything you say or hear to a server. A local open-weight model makes both true. It also costs nothing to run every night, and I can swap the model from a dropdown instead of waiting for an API to change.

## The Lazy Payoff
One click replaces searching for a story or a playlist, and the sleep timer replaces getting up to turn it off.

## Prize Categories
Remove this section if none apply.
