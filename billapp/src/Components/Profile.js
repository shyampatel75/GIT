import React, { useState, useEffect } from "react";

const Profile = () => {
    const [showFileUpload, setShowFileUpload] = useState(false);
    const [profileData, setProfileData] = useState({
        first_name: "",
        email: "",
        // password: "",
        mobile: ""
    });
    const [images, setImages] = useState({
        image1: null,
        image2: null,
        image1Preview: null,
        image2Preview: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Fetch existing profile data on component mount
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const userResponse = await fetch("http://localhost:8000/api/auth/me/", {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem("access_token")}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!userResponse.ok) {
                    throw new Error('Failed to fetch profile');
                }
                
                const userData  = await userResponse.json();

                   const profileResponse = await fetch("http://localhost:8000/api/profile/", {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem("access_token")}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                const profileData = profileResponse.ok ? await profileResponse.json() : null;

                // const { user, profile } = data;
                
                setProfileData({
                    first_name: userData.first_name || "",
                    email: userData.email || "",
                    mobile: userData.mobile || "",
                    // password: "" // Never pre-fill password for security
                });
                
                if (profileData) {
                    setImages(prev => ({
                        ...prev,
                        image1Preview: profileData.image1_url || null,
                        image2Preview: profileData.image2_url || null
                    }));
                }
            } catch (err) {
                console.error("Error fetching profile:", err);
                setError("Failed to load profile data");
            }
        };
        fetchProfile();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleButtonClick = () => {
        setShowFileUpload(true);
    };

    const handleImage1Change = (e) => {
        const file = e.target.files[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setImages(prev => ({
                ...prev,
                image1: file,
                image1Preview: previewUrl
            }));
        }
    };

    const handleImage2Change = (e) => {
        const file = e.target.files[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setImages(prev => ({
                ...prev,
                image2: file,
                image2Preview: previewUrl
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

      try {
            // Update user data (first_name and mobile)
            const userResponse = await fetch("http://localhost:8000/api/profile/", {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem("access_token")}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    first_name: profileData.first_name,
                    email:profileData.email,
                    mobile: profileData.mobile
                })
            });

            if (!userResponse.ok) {
                const errorData = await userResponse.json();
                throw new Error(errorData.message || 'Failed to update user info');
            }

            // Handle image uploads to profile endpoint if needed
            

            if (images.image1 || images.image2) {
                const formData = new FormData();
                if (images.image1) formData.append("image1", images.image1);
                if (images.image2) formData.append("image2", images.image2);

                const profileResponse = await fetch("http://localhost:8000/api/profile/", {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem("access_token")}`
                    },
                    body: formData
                });

                if (!profileResponse.ok) {
                    const errorData = await profileResponse.json();
                    throw new Error('Failed to update profile images');
                }
            }

            alert("Profile updated successfully!");
            setShowFileUpload(false);
        } catch (err) {
            console.error("Error updating profile:", err);
            setError(err.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5">
            {!showFileUpload ? (
                <div className="card p-4">
                    <div className="text-center mb-3">
                        <img
                            src={images.image1Preview || "https://via.placeholder.com/100"}
                            alt="Profile"
                            className="rounded-circle"
                            width="100"
                            height="100"
                        />
                    </div>
                    <div className="mb-3">
                        <label>Name</label>
                        <input
                            type="text"
                            name="first_name"
                            className="form-control"
                            placeholder="Enter Name"
                            value={profileData.first_name}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="mb-3">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            className="form-control"
                            placeholder="Enter Email"
                            value={profileData.email}
                            
                            // readOnly  // Changed from disabled to readOnly for better styling
                        />
                    </div>
                    {/* <div className="mb-3">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            className="form-control"
                            placeholder="Enter new password (leave blank to keep current)"
                            value={profileData.password}
                            onChange={handleInputChange}
                        />
                    </div> */}
                    <div className="mb-3">
                        <label>Mobile Number</label>
                        <input
                            type="text"
                            name="mobile"
                            className="form-control"
                            placeholder="Enter Mobile Number"
                            value={profileData.mobile}
                            onChange={handleInputChange}
                        />
                    </div>
                    <button onClick={handleButtonClick} className="btn btn-primary w-100">
                        Next
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div className="card p-4">
                        <h5>Select Profile Picture - 1</h5>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImage1Change}
                            className="form-control mb-3"
                        />
                        {images.image1Preview && (
                            <div className="text-center mt-3">
                                <h6>Preview 1:</h6>
                                <img
                                    src={images.image1Preview}
                                    alt="Preview 1"
                                    className="img-thumbnail"
                                    style={{ objectFit: "contain", width: "100%", height: "200px" }}
                                />
                            </div>
                        )}

                        <h5 className="mt-4">Select Profile Picture - 2</h5>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImage2Change}
                            className="form-control mb-3"
                        />
                        {images.image2Preview && (
                            <div className="text-center mt-3">
                                <h6>Preview 2:</h6>
                                <img
                                    src={images.image2Preview}
                                    alt="Preview 2"
                                    className="img-thumbnail"
                                    style={{ objectFit: "contain", width: "100%", height: "200px" }}
                                />
                            </div>
                        )}

                        <div className="mt-4">
                            <h5>Other Details Section</h5>
                            <p>You can add more fields here if needed...</p>
                        </div>

                        {error && (
                            <div className="alert alert-danger mt-3">
                                {error}
                            </div>
                        )}

                        <div className="mt-4 d-flex justify-content-between">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setShowFileUpload(false)}
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? "Saving..." : "Save Profile"}
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
};

export default Profile;