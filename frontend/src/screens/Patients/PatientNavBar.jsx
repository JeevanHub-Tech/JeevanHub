import DashboardNavbar from "@/components/layout/DashboardNavbar";
import { patientExploreOptions, patientNavigation } from "./patientNavigation";

function PatientNavBar() {
	return (
		<DashboardNavbar
			navItems={patientNavigation}
			exploreOptions={patientExploreOptions}
			profileTo="/profile/patient"
			notificationsTo="/notifications"
			cartTo="/cart"
			logoTo="/patient-home"
		/>
	);
}

export default PatientNavBar;
