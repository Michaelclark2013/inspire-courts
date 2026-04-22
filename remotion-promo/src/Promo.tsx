import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { ColdOpen } from "./scenes/ColdOpen";
import { FeatureMontage } from "./scenes/FeatureMontage";
import { FacilityStats } from "./scenes/FacilityStats";
import { TournamentTicker } from "./scenes/TournamentTicker";
import { LogoLockup } from "./scenes/LogoLockup";
import { CTA } from "./scenes/CTA";
import { Grain } from "./components/Grain";
import { BRAND } from "./brand";

export const Promo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.bg }}>
      <Series>
        <Series.Sequence durationInFrames={75}>
          <ColdOpen />
        </Series.Sequence>
        <Series.Sequence durationInFrames={180}>
          <FeatureMontage />
        </Series.Sequence>
        <Series.Sequence durationInFrames={180}>
          <FacilityStats />
        </Series.Sequence>
        <Series.Sequence durationInFrames={180}>
          <TournamentTicker />
        </Series.Sequence>
        <Series.Sequence durationInFrames={165}>
          <LogoLockup />
        </Series.Sequence>
        <Series.Sequence durationInFrames={120}>
          <CTA />
        </Series.Sequence>
      </Series>
      <Grain />
    </AbsoluteFill>
  );
};
