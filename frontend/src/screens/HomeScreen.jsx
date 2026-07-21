import React from "react";

import "./HomeScreen.css";
import HeroSection from "./HeroSection";
import RequestCallback from "./RequestCallback";
import ShopByConcern from "./ShopByConcern";
import ShopBySkinType from "./ShopBySkinType";
import SuccessRate from "./SuccessRate";
import TalkOfTheTown from "./TalkOfTheTown";
import TopTransformationStories from "./TopTransformationStories";
import TreatmentSection from "./treatmentsection";
import YogaPositions from "./YogaPostions";

function HomeScreen() {
  return (
    <main className="homeScreen bg-background pt-20 lg:pt-28">
      <HeroSection />
      <ShopBySkinType />
      <ShopByConcern />
      <TalkOfTheTown />
      <TreatmentSection />
      <YogaPositions />
      <TopTransformationStories />
      <SuccessRate />
      <RequestCallback />
    </main>
  );
}

export default HomeScreen;
