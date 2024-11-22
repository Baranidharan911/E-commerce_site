import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import '../styles/AddressBook.css';

const AddressBook = () => {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [defaultAddressId, setDefaultAddressId] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const auth = getAuth();

    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        console.error("User not logged in.");
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        if (!userId) return;

        const q = query(collection(db, "addresses"), where("user_id", "==", userId));
        const querySnapshot = await getDocs(q);

        const fetchedAddresses = [];
        querySnapshot.forEach(docSnapshot => {
          const data = docSnapshot.data();
          fetchedAddresses.push({ id: docSnapshot.id, ...data });
        });

        const defaultAddress = fetchedAddresses.find(address => address.defaultAddress);
        if (defaultAddress) {
          setDefaultAddressId(defaultAddress.id);
        }

        setAddresses(fetchedAddresses);
        console.log('Fetched addresses:', fetchedAddresses);
      } catch (error) {
        console.error("Error fetching addresses: ", error);
      }
    };

    fetchAddresses();
  }, [userId]);

  const handleAddNewAddress = () => {
    navigate('/my-addresses');
  };

  const handleEditAddress = (id) => {
    navigate(`/edit-address/${id}`); // Navigate to the address form with the address ID
  };

  const handleRemoveAddress = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this address? This action cannot be undone.");
    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, "addresses", id));
        setAddresses(addresses.filter(address => address.id !== id));
      } catch (error) {
        console.error("Error deleting address: ", error);
      }
    }
  };

  const handleSetDefault = async (id) => {
    if (defaultAddressId === id) return;

    const confirmDefault = window.confirm("Are you sure you want to set this address as your default? The previous default address will be unset.");
    if (confirmDefault) {
      try {
        const batch = writeBatch(db);

        // Unset the default address for all addresses
        addresses.forEach(address => {
          const addressRef = doc(db, "addresses", address.id);
          batch.update(addressRef, { 'defaultAddress': false });
        });

        // Set the selected address as default
        const defaultAddressRef = doc(db, "addresses", id);
        batch.update(defaultAddressRef, { 'defaultAddress': true });

        // Commit the batch
        await batch.commit();

        // Update the local state
        setDefaultAddressId(id);
        setAddresses(addresses.map(address =>
          address.id === id
            ? { ...address, defaultAddress: true }
            : { ...address, defaultAddress: false }
        ));

        console.log('Default address set with ID:', id);

      } catch (error) {
        console.error("Error setting default address: ", error);
      }
    }
  };

  const handleUpdateAddress = (updatedAddress) => {
    setAddresses(addresses.map(address =>
      address.id === updatedAddress.id
        ? { ...address, ...updatedAddress }
        : address
    ));
  };

  return (
    <div className="address-book-container">
      <div className="breadcrumbs">
        <span>Home</span> / <span>My Account</span> / <span>My Address</span>
      </div>
      <h1>My Address</h1>
      <div className="addresses">
        <div className="address-card add-new-address-card" onClick={handleAddNewAddress}>
          <div className="add-address-icon">+</div>
          <div className="add-address-text">Add Address</div>
        </div>

        {addresses.length > 0 ? (
          addresses.map((address, index) => (
            <div key={index} className="address-card">
              <div className="address-details">
                <strong>
                  {address.firstName} {address.lastName}
                  {address.defaultAddress && <span> (default)</span>}
                </strong>
                <p>{address.addressLine1}</p>
                <p>{address.addressLine2}</p>
                <p>{address.city}, {address.state} {address.zipCode}</p>
                <p>Phone number: {address.phoneNumber}</p>
              </div>
              <div className="address-actions">
                <a className="action-link" onClick={() => handleEditAddress(address.id)}>Edit</a>
                <span className="divider">|</span>
                <a className="action-link" onClick={() => handleRemoveAddress(address.id)}>Remove</a>
          
              </div>
            </div>
          ))
        ) : (
          <div className="no-address">
            <p>No addresses found. Please add a new address.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressBook;
