import { Body } from "@react-email/body";
import { Container } from "@react-email/container";
import { Head } from "@react-email/head";
import { Heading } from "@react-email/heading";
import { Html } from "@react-email/html";
import { Preview } from "@react-email/preview";
import { Row } from "@react-email/row";
import { Section } from "@react-email/section";
import { Text } from "@react-email/text";
import { Column } from "@react-email/column";
import { render, toPlainText } from "@react-email/render";
import type { CSSProperties } from "react";

type ApplicantConfirmationEmailProps = {
  firstName: string;
};

const colors = {
  forest: "#052D20",
  gold: "#D6B15A",
  muted: "#52665E",
  panel: "#FCF6E9",
  border: "#E8DFCA",
};

const bodyStyle: CSSProperties = {
  backgroundColor: "#FFFFFF",
  color: colors.forest,
  fontFamily: "Arial, Helvetica, sans-serif",
  margin: "0",
};

const containerStyle: CSSProperties = {
  border: `1px solid ${colors.border}`,
  borderRadius: "18px",
  margin: "0 auto",
  maxWidth: "600px",
  overflow: "hidden",
  width: "100%",
};

export function ApplicantConfirmationEmail({ firstName }: ApplicantConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>We&apos;ve received your coverage inquiry.</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={{ backgroundColor: colors.forest, padding: "26px 32px" }}>
            <Text style={{ color: "#FFFFFF", fontSize: "13px", fontWeight: "700", letterSpacing: "1.5px", margin: "0", textTransform: "uppercase" }}>
              TMF <span style={{ fontWeight: "400", opacity: "0.78" }}>|</span> Insurance Group
            </Text>
          </Section>

          <Section style={{ padding: "34px 32px 18px" }}>
            <Heading as="h1" style={{ color: colors.forest, fontSize: "30px", fontWeight: "700", letterSpacing: "-0.6px", lineHeight: "1.2", margin: "0 0 26px" }}>
              We&apos;ve received your inquiry.
            </Heading>
            <Text style={copyStyle}>Hi {firstName},</Text>
            <Text style={copyStyle}>
              Thanks for reaching out! TMF Insurance Group has received your information and will follow up using your preferred contact method.
            </Text>
          </Section>

          <Section style={{ padding: "4px 32px 24px" }}>
            <Section style={{ backgroundColor: colors.panel, borderRadius: "12px", margin: "0", padding: "18px 20px", width: "100%" }}>
              <Row>
                <Column style={{ verticalAlign: "top", width: "28px" }}>
                  <Text style={{ color: colors.gold, fontSize: "20px", fontWeight: "700", lineHeight: "1", margin: "1px 0 0" }}>✓</Text>
                </Column>
                <Column style={{ verticalAlign: "middle" }}>
                  <Text style={{ color: colors.forest, fontSize: "15px", fontWeight: "700", lineHeight: "1.5", margin: "0" }}>Your inquiry has been received.</Text>
                </Column>
              </Row>
            </Section>
          </Section>

          <Section style={{ padding: "0 32px 34px" }}>
            <Text style={copyStyle}>There&apos;s nothing else you need to do right now. A member of the TMF Insurance Group team will follow up using your preferred contact method.</Text>
            <Text style={copyStyle}>We look forward to speaking with you.</Text>
            <Text style={{ ...copyStyle, marginBottom: "0" }}>
              TMF Insurance Group
            </Text>
          </Section>

          <Section style={{ backgroundColor: "#FCF6E9", borderTop: `1px solid ${colors.border}`, padding: "18px 32px" }}>
            <Text style={{ color: colors.muted, fontSize: "12px", lineHeight: "1.55", margin: "0" }}>
              This is an automated acknowledgment of your inquiry. Please do not reply with sensitive medical information.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const copyStyle: CSSProperties = {
  color: colors.forest,
  fontSize: "16px",
  lineHeight: "1.65",
  margin: "0 0 18px",
};

export async function renderApplicantConfirmation(firstName: string) {
  const html = await render(<ApplicantConfirmationEmail firstName={firstName} />);
  return { html, text: toPlainText(html) };
}

ApplicantConfirmationEmail.PreviewProps = { firstName: "Jordan" } satisfies ApplicantConfirmationEmailProps;

export default ApplicantConfirmationEmail;
