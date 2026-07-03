import React, { useContext, useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../NavBar.css";
import "./PatientNavBar.css";
import logo from "../../media/logo2.png";
import locationIcon from "../../media/location.png";
import defaultProfilePic from "../../media/default-profile.png";
import notificationIcon from "../../media/notifications.png";
import { AuthContext } from "../../context/AuthContext";
import menu from "../../media/menu.svg";
import menu_close from "../../media/menu-close.svg";

const API_KEY = process.env.REACT_APP_OPENCAGE_API_KEY;

function PatientNavBar() {
	const navigate = useNavigate();
	const { auth, setAuth } = useContext(AuthContext);
	const [showModal, setShowModal] = useState(false);
	const modalRef = useRef(null);
	const [userLocation, setUserLocation] = useState("Fetching location...");
	const [cityName, setCityName] = useState(""); // State for city name
	const [userAddress, setUserAddress] = useState(
		auth.user?.address || "Not available"
	);

	const profilePic = auth.user?.profileImage || null;
	const userFirstName = auth.user ? auth.user.firstName : "Guest";
	const userLastName = auth.user ? auth.user.lastName : "";
	const userName = userFirstName + " " + userLastName;
	const userPhone = auth.user ? auth.user.phone : "N/A";
	const userEmail = auth.user ? auth.user.email : "N/A";

	const [showMenu, setShowMenu] = useState(false);
	const handleMenuClose = () => {
		setShowMenu(!showMenu);
	};

	const handleSignOut = () => {
		setAuth({ token: null, user: null, role: 'guest' });
		localStorage.removeItem("token");
		localStorage.removeItem("role");
		navigate("/signin");
	};

	useEffect(() => {
		// Function to get the user's location
		const fetchLocation = () => {
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(
					(position) => {
						const { latitude, longitude } = position.coords;
						setUserLocation(`Lat: ${latitude}, Lon: ${longitude}`);
						fetchCityName(latitude, longitude);
					},
					() => {
						setUserLocation("Location access denied");
					}
				);
			} else {
				setUserLocation("Geolocation not supported");
			}
		};

		fetchLocation();
	}, []);

	// Close modal when clicking outside of it
	useEffect(() => {
		function handleClickOutside(event) {
			if (modalRef.current && !modalRef.current.contains(event.target)) {
				setShowModal(false);
			}
		}

		if (showModal) {
			document.addEventListener("mousedown", handleClickOutside);
		} else {
			document.removeEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [showModal]);

	const fetchCityName = async (latitude, longitude) => {
		try {
			const response = await fetch(
				`https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${API_KEY}`
			);
			const data = await response.json();
			if (data.results.length > 0) {
				const city =
					data.results[0].components.city ||
					data.results[0].components.town ||
					"Unknown location";
				setCityName(city);
			} else {
				setCityName("City not found");
			}
		} catch (error) {
			setCityName("Error fetching city name");
			console.error("Error fetching city name:", error);
		}
	};

	const handleProfileClick = () => {
		navigate("/profile/patient");
	};

	return (
		<header className="navbar-header">
			<div className="top-navbar">
				<div className="logo-container">
					<img src={logo} alt="Ayurvedic Logo" className="nav-logo" />
					<div className="text-container">
						<div className="logo-text">AYURVEDIC</div>
						<div className="consultations-text">eHub</div>
					</div>
				</div>

				<div className="search-signin">
					<div className="search-bar">
						<div className="dropdown">
							<select onChange={(e) => {
								const value = e.target.value;
								switch(value) {
									case "doctor": navigate("/doctors"); break;
									case "disease": navigate("/treatments"); break;
									case "medicine": navigate("/medicines"); break;
									case "diet-yoga": navigate("/diet-yoga"); break;
									case "blogs-videos": navigate("/blogs-videos"); break;
									default: break;
								}
							}}>
								<option value="" disabled selected hidden>Explore...</option>
								<option value="doctor">Doctor</option>
								<option value="disease">Diseases</option>
								<option value="medicine">Medicines</option>
								<option value="diet-yoga">Diet And Yoga</option>
								<option value="blogs-videos">Blogs</option>
							</select>
						</div>
						<input type="text" placeholder="Search" className="search-input" />
					</div>
				</div>

				<div className="auth" onClick={handleProfileClick}>
					<span className="topnav-username">{userName}</span>
					<img
						src={profilePic || defaultProfilePic}
						alt="Profile"
						className="profile-pic"
					/>
				</div>

				<NavLink to="/notifications" className="notification-icon">
					<img
						src={notificationIcon}
						alt="Notifications"
						className="notification-img"
					/>
				</NavLink>
			</div>

			{/* Modal has been replaced by a dedicated profile page */}

			<nav className="navbar">
				<div className="left-item">
					<img
						src={locationIcon}
						alt="Location Icon"
						className="location-icon"
					/>
					<span className="location-text">{cityName || userLocation}</span>
				</div>
				<div className="center-items">
					{showMenu && (
						<div className="nav-menu">
							<ul className="nav-sidebar" style={{ width: "60%" }}>
								<img
									src={menu_close}
									alt="menu_close"
									onClick={handleMenuClose}
									style={{
										zIndex: "99",
									}}
								/>
								<li>
									<NavLink to="/patient-home">
										Home
									</NavLink>
								</li>
								<li>
									<NavLink to="/treatments">
										Treatments
									</NavLink>
								</li>
								<li>
									<NavLink to="/doctors">
										Doctors
									</NavLink>
								</li>
								<li>
									<NavLink to="/medicines">
										Medicines
									</NavLink>
								</li>
								<li>
									<NavLink to="/diet-yoga">
										Diet and Yoga Plan
									</NavLink>
								</li>
								<li>
									<NavLink to="/blogs-videos">
										Blogs and Videos
									</NavLink>
								</li>
								<li>
									<NavLink to="/cart">
										Cart
									</NavLink>
								</li>
								<li>
									<NavLink to="/order-history">
										Orders
									</NavLink>
								</li>
							</ul>
						</div>
					)}
					<div className="nav-menu-button">
						<img src={menu} alt="menu" onClick={handleMenuClose} />
					</div>
					<ul className="nav-center-menu">
						<li>
							<NavLink to="/patient-home">
								Home
							</NavLink>
						</li>
						<li>
							<NavLink to="/appointed-doctor">
								Appointed Doctor
							</NavLink>
						</li>
						<li>
							<NavLink to="/treatments">
								Treatments
							</NavLink>
						</li>
						<li>
							<NavLink to="/doctors">
								Doctors
							</NavLink>
						</li>
						<li>
							<NavLink to="/medicines">
								Medicines
							</NavLink>
						</li>
						<li>
							<NavLink to="/diet-yoga">
								Diet and Yoga Plan
							</NavLink>
						</li>
						<li>
							<NavLink to="/blogs-videos">
								Blogs and Videos
							</NavLink>
						</li>
						<li>
							<NavLink to="/cart">
								Cart
							</NavLink>
						</li>
						<li>
							<NavLink to="/order-history">
								Orders
							</NavLink>
						</li>
					</ul>
				</div>
			</nav>
		</header>
	);
}

export default PatientNavBar;
