import React, { useState } from "react";

const Profile = () => {
    const [showFileUpload, setShowFileUpload] = useState(false);
    const [image1, setImage1] = useState(null);
    const [image2, setImage2] = useState(null);

    const handleButtonClick = () => {
        setShowFileUpload(true);
    };

    const handleImage1Change = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage1(URL.createObjectURL(file));
            // Upload to server if needed
        }
    };

    const handleImage2Change = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage2(URL.createObjectURL(file));
            // Upload to server if needed
        }
    };

    return (
        <div className="container mt-5">
            {!showFileUpload ? (
                <div className="card p-4">
                    <div className="text-center mb-3">
                        <img
                            src="https://via.placeholder.com/100"
                            alt="Profile"
                            className="rounded-circle"
                            width="100"
                            height="100"
                        />
                    </div>
                    <div className="mb-3">
                        <label>Name</label>
                        <input type="text" className="form-control" placeholder="Enter Name" />
                    </div>
                    <div className="mb-3">
                        <label>Email</label>
                        <input type="email" className="form-control" placeholder="Enter Email" />
                    </div>
                    <div className="mb-3">
                        <label>Password</label>
                        <input type="password" className="form-control" placeholder="Enter Password" />
                    </div>
                    <div className="mb-3">
                        <label>Mobile Number</label>
                        <input type="text" className="form-control" placeholder="Enter Mobile Number" />
                    </div>
                    <button onClick={handleButtonClick} className="btn btn-primary w-100">
                        Next
                    </button>
                </div>
            ) : (
                <div className="card p-4">
                    <h5>Select Profile Picture - 1</h5>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImage1Change}
                        className="form-control mb-3"
                    />
                    {image1 && (
                        <div className="text-center mt-3">
                            <h6>Preview 1:</h6>
                            <img
                                src={image1}
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
                    {image2 && (
                        <div className="text-center mt-3">
                            <h6>Preview 2:</h6>
                            <img
                                src={image2}
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
                </div>
            )}
        </div>
    );
};

export default Profile;
