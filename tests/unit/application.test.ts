import { describe, expect, it } from "vitest";
import { applicationSchema } from "@/features/applications/schema";

const valid = {
  firstName: "Maria",
  lastName: "Santos",
  email: "maria@example.com",
  phone: "09171234567",
  location: "Cebu",
  position: "Customer Service",
  privacyConsent: true,
};

describe("application boundary validation", () => {
  it("keeps the legacy serialized payload unchanged when screening fields are blank", () => {
    const originalPayload = {
      firstName: "Maria",
      lastName: "Santos",
      email: "maria@example.com",
      phone: "+639171234567",
      location: "Cebu",
      position: "Customer Service",
      employmentStatus: "",
      availability: "",
      resume: "",
      message: "",
      privacyConsent: true,
      source: "",
      campaign: "",
      utm_source: "",
      utm_medium: "",
      utm_campaign: "",
      landing_page: "/apply",
    };
    const { website, ...parsed } = applicationSchema.parse({
      ...valid,
      expectedSalary: "  ",
      previousSalary: "",
      strengthOne: "",
      strengthTwo: "",
      distanceFromDagupan: "",
      relocationPreference: "",
      portfolio: "",
    });
    expect(website).toBe("");
    expect(JSON.stringify(parsed)).toBe(JSON.stringify(originalPayload));
    expect(
      JSON.stringify(
        applicationSchema.parse({ ...valid, expectedSalary: "Negotiable" }),
      ),
    ).toContain('"expectedSalary":"Negotiable"');
  });
  it("accepts optional screening details and bounds sensitive free text", () => {
    expect(
      applicationSchema.parse({
        ...valid,
        expectedSalary: " PHP 25,000/month ",
        previousSalary: "Prefer not to share",
        strengthOne: "Communication",
        strengthTwo: "Problem solving",
        distanceFromDagupan: "About 30 minutes",
        relocationPreference: "Discuss first",
        portfolio: "https://example.com/work",
      }),
    ).toMatchObject({
      expectedSalary: "PHP 25,000/month",
      relocationPreference: "Discuss first",
    });
    for (const [field, length] of [
      ["expectedSalary", 101],
      ["previousSalary", 101],
      ["strengthOne", 301],
      ["strengthTwo", 301],
      ["distanceFromDagupan", 201],
      ["portfolio", 2001],
    ] as const)
      expect(
        applicationSchema.safeParse({ ...valid, [field]: "x".repeat(length) })
          .success,
      ).toBe(false);
    for (const portfolio of [
      "javascript:alert(1)",
      "file:///tmp/cv",
      "invalid",
    ])
      expect(applicationSchema.safeParse({ ...valid, portfolio }).success).toBe(
        false,
      );
    expect(
      applicationSchema.safeParse({
        ...valid,
        relocationPreference: "arbitrary",
      }).success,
    ).toBe(false);
  });
  it("normalizes names, email, phone and absent optional fields", () => {
    const result = applicationSchema.parse({
      ...valid,
      firstName: " Maria ",
      email: " MARIA@example.com ",
    });
    expect(result).toMatchObject({
      firstName: "Maria",
      email: "maria@example.com",
      phone: "+639171234567",
      message: "",
      source: "",
      landing_page: "/apply",
    });
    expect(result.experience).toBeUndefined();
  });
  it.each([
    "09171234567",
    "639171234567",
    "+639171234567",
    "+63 (917) 123-4567",
    "0917 123 4567",
  ])("accepts Philippine mobile format %s", (phone) => {
    expect(applicationSchema.parse({ ...valid, phone }).phone).toBe(
      "+639171234567",
    );
  });
  it.each(["", "123456", "+12025551234", "091712345678", "0917abc4567"])(
    "rejects invalid mobile %s",
    (phone) => {
      expect(applicationSchema.safeParse({ ...valid, phone }).success).toBe(
        false,
      );
    },
  );
  it.each(["firstName", "lastName", "email", "phone", "location", "position"])(
    "requires %s",
    (field) => {
      expect(
        applicationSchema.safeParse({ ...valid, [field]: "" }).success,
      ).toBe(false);
    },
  );
  it("requires actual boolean consent", () => {
    for (const privacyConsent of [false, undefined, "true"]) {
      expect(
        applicationSchema.safeParse({ ...valid, privacyConsent }).success,
      ).toBe(false);
    }
  });
  it("checks name bounds after trimming", () => {
    for (const firstName of [" M ", "a".repeat(101)])
      expect(applicationSchema.safeParse({ ...valid, firstName }).success).toBe(
        false,
      );
    expect(
      applicationSchema.safeParse({ ...valid, firstName: "a".repeat(100) })
        .success,
    ).toBe(true);
  });
  it("bounds notes, other text, and tracking", () => {
    for (const field of [
      "location",
      "position",
      "employmentStatus",
      "availability",
      "source",
      "campaign",
      "utm_source",
      "utm_medium",
      "utm_campaign",
    ]) {
      expect(
        applicationSchema.safeParse({ ...valid, [field]: "x".repeat(201) })
          .success,
      ).toBe(false);
    }
    expect(
      applicationSchema.safeParse({ ...valid, message: "x".repeat(2001) })
        .success,
    ).toBe(false);
    expect(
      applicationSchema.safeParse({ ...valid, message: "x".repeat(2000) })
        .success,
    ).toBe(true);
  });
  it.each(["0", "2.5", "60"])("accepts experience %s", (experience) => {
    expect(applicationSchema.parse({ ...valid, experience }).experience).toBe(
      Number(experience),
    );
  });
  it.each(["-1", "61", "Infinity", "years", "1e1"])(
    "rejects experience %s",
    (experience) => {
      expect(
        applicationSchema.safeParse({ ...valid, experience }).success,
      ).toBe(false);
    },
  );
  it.each(["https://example.com/resume", "http://example.com/resume", ""])(
    "accepts optional resume %s",
    (resume) => {
      expect(applicationSchema.safeParse({ ...valid, resume }).success).toBe(
        true,
      );
    },
  );
  it.each(["javascript:alert(1)", "file:///tmp/resume", "not a url"])(
    "rejects resume %s",
    (resume) => {
      expect(applicationSchema.safeParse({ ...valid, resume }).success).toBe(
        false,
      );
    },
  );
  it("rejects filled honeypots", () => {
    expect(
      applicationSchema.safeParse({ ...valid, website: "spam" }).success,
    ).toBe(false);
  });
  it("rejects query strings in landing_page and strips unknown keys", () => {
    expect(
      applicationSchema.safeParse({
        ...valid,
        landing_page: "/apply?email=private",
      }).success,
    ).toBe(false);
    expect(
      applicationSchema.parse({ ...valid, unexpected: "ignored" }),
    ).not.toHaveProperty("unexpected");
  });
});
