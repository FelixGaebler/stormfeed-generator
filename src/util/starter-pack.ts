import { AtpAgent } from '@atproto/api'

const STARTER_PACK_URL = process.env.STARTER_PACK_URL
const BLUESKY_HANDLE = process.env.BLUESKY_HANDLE
const BLUESKY_PASSWORD = process.env.BLUESKY_PASSWORD
const KEYWORDS = process.env.KEYWORDS

if (!STARTER_PACK_URL) throw new Error('Missing env var: STARTER_PACK_URL')
if (!BLUESKY_HANDLE) throw new Error('Missing env var: BLUESKY_HANDLE')
if (!BLUESKY_PASSWORD) throw new Error('Missing env var: BLUESKY_PASSWORD')
if (!KEYWORDS) throw new Error('Missing env var: KEYWORDS')

const agent = new AtpAgent({ service: 'https://bsky.social' })

let authors: ReadonlySet<string> = new Set()
const keywords: string[] = KEYWORDS.split(',').map(k => k.trim().toLowerCase())

function parseStarterPackUrl(url: string): { repo: string; rkey: string } {
  const match = url.match(/starter-pack\/([^/]+)\/([^/]+)$/)
  if (!match) throw new Error(`Invalid Starter Pack URL: ${url}`)
  return { repo: match[1], rkey: match[2] }
}

/**
 * Load all authors from the starter pack defined in env.
 */
export async function loadStarterPackAuthors(): Promise<void> {
  await agent.login({
    identifier: BLUESKY_HANDLE!,
    password: BLUESKY_PASSWORD!,
  })

  const { repo, rkey } = parseStarterPackUrl(STARTER_PACK_URL!)

  const pack = await agent.com.atproto.repo.getRecord({
    repo,
    collection: 'app.bsky.graph.starterpack',
    rkey,
  })

  const listUri: string | undefined = (pack.data.value as any)?.list
  if (!listUri || typeof listUri !== 'string') {
    throw new Error('Starter pack has no linked list URI')
  }

  const listRes = await agent.app.bsky.graph.getList({ list: listUri })
  const dids =
    listRes.data.items
      ?.map(i => i.subject?.did)
      .filter((did): did is string => typeof did === 'string') ?? []

  authors = new Set(dids)
  console.log(`✅ Loaded ${authors.size} authors`)
}

/**
 * Return currently loaded authors.
 */
export function getAuthors(): ReadonlySet<string> {
  return authors
}

/**
 * Return keyword list.
 */
export function getKeywords(): string[] {
  return keywords
}
