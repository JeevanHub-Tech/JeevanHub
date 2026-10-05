import React from "react";
import { useTranslation } from "react-i18next";
import DashboardNavbar from "@/components/layout/DashboardNavbar";

function PatientNavBar() {
	const { t } = useTranslation();

	const navItems = [
		{ label: t("patientNav.home", "Home"), to: "/patient-home" },
		{ label: t("patientNav.appointedDoctor", "Appointed doctor"), to: "/appointed-doctor" },
		{ label: t("patientNav.treatments", "Treatments"), to: "/treatments" },
		{ label: t("patientNav.doctors", "Doctors"), to: "/doctors" },
		{ label: t("patientNav.medicines", "Medicines"), to: "/medicines" },
		{ label: t("patientNav.prescriptionWellness", "Prescription & Wellness"), to: "/prescription-wellness" },
		{ label: t("patientNav.blogsVideos", "Blogs & videos"), to: "/blogs-videos" },
		{ label: t("patientNav.orders", "Orders"), to: "/order-history" },
	];

	const exploreOptions = [
		{ label: t("patientNav.doctors", "Doctors"), value: "doctor", to: "/doctors" },
		{ label: t("patientNav.treatments", "Treatments"), value: "disease", to: "/treatments" },
		{ label: t("patientNav.medicines", "Medicines"), value: "medicine", to: "/medicines" },
		{ label: t("patientNav.prescriptionWellness", "Prescription & Wellness"), value: "prescription-wellness", to: "/prescription-wellness" },
		{ label: t("patientNav.blogsVideos", "Blogs & videos"), value: "blogs-videos", to: "/blogs-videos" },
	];

	return (
		<DashboardNavbar
			navItems={navItems}
			exploreOptions={exploreOptions}
			profileTo="/profile/patient"
			notificationsTo="/notifications"
			cartTo="/cart"
			logoTo="/patient-home"
		/>
	);
}

export default PatientNavBar;
