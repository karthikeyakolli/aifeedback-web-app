# Reusable Architectural Patterns & Engineering Blueprints

This document captures proven software design patterns extracted from the reference repositories that can be cleanly adapted for our platform.

---

## 1. Pattern 1: Optimistic UI with Graceful Rollback

- **Source Reference**: [`references/repositories/Quackback/apps/web/src/components/public/auth-vote-button.tsx`](file:///c:/Users/OMEN/.gemini/antigravity-ide/scratch/ai%20web%20application/references/repositories/Quackback/apps/web/src/components/public/auth-vote-button.tsx)
- **Problem**: When a user clicks "Upvote" or "Helpful", waiting for a server round-trip (100–300ms) introduces perceptible latency, making the app feel slow and unresponsive.
- **Pattern Solution**:
  ```typescript
  // 1. Snapshot previous state
  const previousVote = hasVoted;
  const previousCount = voteCount;

  // 2. Mutate UI optimistically
  setHasVoted(!previousVote);
  setVoteCount(previousVote ? previousCount - 1 : previousCount + 1);

  // 3. Fire asynchronous API mutation
  try {
    await apiClient.post(`/api/products/${productId}/vote`);
  } catch (error) {
    // 4. Rollback to original snapshot on error & alert user
    setHasVoted(previousVote);
    setVoteCount(previousCount);
    toast.error("Failed to register vote. Please check your connection.");
  }
  ```
- **Value**: Renders instantaneous feedback at 60 FPS while preserving eventual consistency.

---

## 2. Pattern 2: Bounded Threaded Comments with Author Role Badges

- **Source Reference**: [`references/repositories/Quackback/apps/web/src/components/public/comment-thread.tsx`](file:///c:/Users/OMEN/.gemini/antigravity-ide/scratch/ai%20web%20application/references/repositories/Quackback/apps/web/src/components/public/comment-thread.tsx)
- **Problem**: Unbounded recursive comments cause extreme horizontal indentations on mobile screens and complicate database queries.
- **Pattern Solution**:
  - Bound the tree depth to maximum 2 levels:
    - Root level: Top-level review / feedback items.
    - Level 1: Direct replies / maker explanations.
    - Subsequent replies flatten at Level 1 with an `@user` mention.
  - Store `parent_id` foreign key with an index on `(target_id, parent_id)`.
  - Attach role metadata (`Maker`, `Verified Tester`) during query joins to eliminate secondary HTTP lookups.

---

## 3. Pattern 3: Relay Cursor-Based Pagination

- **Source Reference**: [`references/repositories/Product-Hunt-API/schema.graphql`](file:///c:/Users/OMEN/.gemini/antigravity-ide/scratch/ai%20web%20application/references/repositories/Product-Hunt-API/schema.graphql)
- **Problem**: Offset-based pagination (`OFFSET 20 LIMIT 20`) causes skipped or duplicate records when new launches are posted while a user is actively paginating through the feed.
- **Pattern Solution**:
  - Return opaque cursor tokens encoding the sorting criteria and ID (e.g., `base64(vote_count:id)`):
    ```json
    {
      "edges": [
        { "cursor": "YXJyYXljb25uZWN0aW9uOjE5", "node": { "id": "p_123", "name": "App" } }
      ],
      "pageInfo": {
        "endCursor": "YXJyYXljb25uZWN0aW9uOjE5",
        "hasNextPage": true
      }
    }
    ```
  - Fetch next page using: `GET /api/feed?after=YXJyYXljb25uZWN0aW9uOjE5&limit=20`.

---

## 4. Pattern 4: Scheduled Launch State Machine via Cron Triggers

- **Source Reference**: [`references/repositories/Open-Launch/app/api/cron/update-launches/route.ts`](file:///c:/Users/OMEN/.gemini/antigravity-ide/scratch/ai%20web%20application/references/repositories/Open-Launch/app/api/cron/update-launches/route.ts)
- **Problem**: Makers schedule launches in advance, but products must become publicly votable at the exact second the launch window opens (00:00 UTC).
- **Pattern Solution**:
  - Products exist in `scheduled` state with `launch_date = '2026-11-02'`.
  - A hardened, token-protected cron endpoint runs every minute or at midnight UTC:
    ```sql
    UPDATE products
    SET status = 'ongoing'
    WHERE status = 'scheduled' AND launch_date <= CURRENT_DATE;
    ```
  - Dispatches automated notification emails to followers and makers alerting them that their launch day is live.

---

## 5. Pattern 5: URL-Synchronized Filter State

- **Source Reference**: Quackback & TanStack Router
- **Problem**: Storing active filters only in component state (`useState`) prevents developers from sharing exact search results with colleagues.
- **Pattern Solution**:
  - Reflect all active filter parameters directly in the browser query string:
    `https://platform.dev/feed?category=devtools&stage=prototype&sort=trending`
  - On page load, initialize filters from URL parameters:
    ```typescript
    const [searchParams, setSearchParams] = useSearchParams();
    const category = searchParams.get("category") || "all";
    const sort = searchParams.get("sort") || "trending";
    ```
  - Guarantees seamless browser back/forward navigation and link sharing across Slack and Discord.

---

## 6. Pattern 6: Atomic Increments with Idempotency Guarantees

- **Source Reference**: Open-Launch and Quackback database schemas
- **Problem**: High-concurrency voting causes write race conditions where read-modify-write cycles drop votes.
- **Pattern Solution**:
  - Enforce a compound unique constraint in SQL:
    ```sql
    ALTER TABLE upvotes ADD CONSTRAINT uq_user_product UNIQUE (user_id, product_id);
    ```
  - Execute atomic increment in a single transaction:
    ```sql
    WITH inserted_vote AS (
      INSERT INTO upvotes (user_id, product_id, created_at)
      VALUES (:user_id, :product_id, NOW())
      ON CONFLICT DO NOTHING
      RETURNING product_id
    )
    UPDATE products
    SET upvote_count = upvote_count + 1
    WHERE id IN (SELECT product_id FROM inserted_vote);
    ```
  - Guarantees that even if 100 simultaneous requests fire, the user can vote exactly once and the count matches total unique votes.

