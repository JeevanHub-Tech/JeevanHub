import { Outlet } from "react-router-dom";

import { DashboardShell } from "@/components/layout/DashboardShell";

function ManageProducts() {
	return (
		<DashboardShell>
			<Outlet />
		</DashboardShell>
	);
}

export default ManageProducts;
