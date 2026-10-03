import type { Metadata } from "next";
import { Container } from "@/components/ui/card";
import { TrackOrder } from "./track-order";

export const metadata: Metadata = { title: "Track your order", robots: { index: false, follow: false } };

export default function TrackOrderPage() {
  return (
    <Container className="py-14">
      <h1 className="text-[2.25rem] leading-tight font-bold tracking-[-0.03em] md:text-[3rem]">Track your order</h1>
      <p className="mt-3 max-w-2xl text-lg text-midnight/75">Enter your order number and the phone number you ordered with.</p>
      <TrackOrder />
    </Container>
  );
}
