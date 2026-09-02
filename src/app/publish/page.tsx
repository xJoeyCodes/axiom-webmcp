import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { PublishForm } from "@/components/publish/publish-form";

export const metadata: Metadata = { title: "Publish" };

export default function PublishPage() {
  return (
    <PageContainer>
      <Section>
        <PageHeader
          eyebrow="Registry intake"
          title="Publish a WebMCP website."
          description="Submit a public website for capability inspection, verification, and inclusion in the Axiom index."
        />
        <div className="pt-12 sm:pt-16">
          <PublishForm />
        </div>
      </Section>
    </PageContainer>
  );
}
