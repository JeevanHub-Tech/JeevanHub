import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import "./ManageProducts.css"; 

function ManageProducts() {
	const location = useLocation();
	const isBulk = location.pathname.includes('/add');

	return (
		<div className={isBulk ? "manage-products-bulk" : "manage-products-container"}>
			<Outlet />
		</div>
	);
}

export default ManageProducts;
