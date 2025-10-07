import React from "react";
import { redirect } from "next/navigation"; 
import { getUserOnboardingStatus } from "@/actions/user";
import { getIndustryInsights } from "@/actions/dashboard";
import DashboardView from "./_components/dashboard-view";

const IndustryInsightsPage=async()=>{
    // First, check onboarding status; if not onboarded, redirect before any heavy work
    const onboard = await getUserOnboardingStatus();
    if(!onboard.isOnboarded){
      redirect("/onboarding");
    }

    // Now safe to fetch insights
    const insights = await getIndustryInsights();

    return(
      <div className="container mx-auto">
        <DashboardView insights={insights}/>
      </div>
    )
}

export default IndustryInsightsPage;