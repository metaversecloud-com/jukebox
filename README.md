# Jukebox

Jukebox app built on Topia's SDK.

## Environment Variables

Create a `.env` file in the root directory. See `.env-example` for a template.

| Variable               | Description                                                                        | Required |
| ---------------------- | ---------------------------------------------------------------------------------- | -------- |
| `NODE_ENV`             | Node environment                                                                   | No       |
| `SKIP_PREFLIGHT_CHECK` | Skip CRA preflight check                                                           | No       |
| `GOOGLE_API_KEY`       | YouTube Data API key for searching videos                                          | Yes      |
| `INSTANCE_DOMAIN`      | Topia API domain (`api.topia.io` for production, `api-stage.topia.io` for staging) | Yes      |
| `INTERACTIVE_KEY`      | Topia interactive app key                                                          | Yes      |
| `INTERACTIVE_SECRET`   | Topia interactive app secret                                                       | Yes      |

## Getting Started

### Built With

#### Client

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

#### Server

![Node.js](https://img.shields.io/badge/node.js-%2343853D.svg?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/express-%23000000.svg?style=for-the-badge&logo=express&logoColor=white)

### Dependencies

- npm

### Installing

- `npm i` in root directory
- `cd client && npm i`
- `npm run dev` in root directory

## Add interactivity to iFrames and webhooks

### Where to find INTERACTIVE_KEY and INTERACTIVE_SECRET

- Click on the My Account image in the top left when in-world.
- Select Integrations
- Create a Key Pair at https://topia.io/t/dashboard/integrations
- Add your INTERACTIVE_KEY and INTERACTIVE_SECRET to your .env
- Add your Developer Public Key and toggle 'on' Add Player Session Credentials to Asset Interactions.

## Implementation Requirements

### Required Assets with Unique Names

The app uses the following unique name patterns for managing dropped assets:

| Unique Name Pattern | Description |
| ------------------- | ----------- |
| `Jukebox_keyAsset`  | Key asset   |
