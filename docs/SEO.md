# Public page SEO

Marketing pages address business clients globally. Careers and Apply address applicants.
Keep titles and descriptions distinct, factual, and consistent with visible content.
Preserve official brand taglines; avoid invented vacancies, benefits, statistics, or contacts.

## Page topics

| Route             | Primary topic                                        |
| ----------------- | ---------------------------------------------------- |
| /                 | Philippine outsourcing and business support          |
| /areas-of-work    | Outsourcing services and six service areas           |
| /how-it-works     | Business enquiry and outsourcing discussion steps    |
| /about            | Philippine outsourcing agency and confirmed location |
| /business-enquiry | Discuss outsourcing needs                            |
| /careers          | Careers and published open roles                     |
| /careers/[jobId]  | The published role's title and location              |
| /apply            | Recruitment application                              |
| /privacy          | Privacy policy                                       |
| /terms            | Website terms                                        |

`lib/page-metadata.ts` supplies canonicals and social metadata. URLs use the
configured `NEXT_PUBLIC_SITE_URL` origin, without tracking queries or fragments.
Use the production canonical hostname in Vercel (currently www.taskwaveph.com).

The static social image is 1200 × 630, using the official logo, Poppins, and
brand colors. Regenerate it with `node scripts/generate-share-image.mjs`.
Homepage Organization and WebSite JSON-LD uses confirmed facts only and escapes
script terminators. It is intentionally absent from private administration.

Sitemap entries include public pages and bounded Published job URLs only.
Unavailable roles, administration, previews, and confirmation pages retain
noindex protections. Confirmation pages additionally require a receipt.
JobPosting structured data is deferred until posting data and eligibility are
reviewed. Do not mark service areas as vacancies.

No SEO plugin, new service route, or tracking integration is required.
