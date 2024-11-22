import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { SummaryProvider } from './context/SummaryContext';
import { CartProvider } from './context/CartContext';
import HomePage from './pages/HomePage.jsx';
import ProductSummaryPage from './pages/ProductSummaryPage.jsx';
import EmptyCart from './components/EmptyCart.jsx';
import RootLayout from './pages/Root.jsx';
import AccountPage from './pages/AccountPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import CartPage from './pages/CartPage.jsx';
import AccountSettings from './pages/AccountSettings.jsx';
import AddressBook from './pages/AddressBook.jsx';
import AddAddress from './pages/AddAddress.jsx';
// import CategoryForm from './pages/Admin-Pages/CategoryForm.jsx';
// import ProductForm from './pages/Admin-Pages/ProductForm.jsx';
// import ProductParametersForm from './pages/Admin-Pages/ProductParametersForm.jsx';
import ProductDescriptionPage from './pages/ProductDescriptionPage.jsx';
import CategoryListingPage from './pages/CategoriesPage.jsx';
import DesignUploadPage from './pages/DesignUploadPage.jsx';
import ProductListingPage from './pages/ProductListingPage';
import CheckoutPage from './pages/CheckoutPage';
import EditAddress from './pages/EditAddress';
import CustomizingPage from './pages/CustomizingPage';
import CartCustomizingPage from './pages/CartCuztomizingPage';
import CartProductSummary from './pages/CartProductSummary.jsx';
import UpdatedProductSummary from './pages/UpdatedProductSummary';
import EditUploadPage from './pages/EditUploadPage';
import WishlistPage from './pages/WishlistPage';
// import NavBarForm from './pages/Admin-Pages/NavBarForm';
// import StoreAddressForm from './pages/Admin-Pages/StoreAddressForm';
import TagCategoriesPage from './pages/TagCategoriesPage';
import { clearSummaryDataLoader } from './components/Utils';

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <HomePage />
      },
      {
        path: "/categories",
        element: <CategoryListingPage/>
      },
      {
        path: "/:categoryName/products",
        element: <ProductListingPage/>
      },
      {
        path: "/:tagId/categories",
        element: <TagCategoriesPage/> 
      },
      {
        path: "/:categoryName/:productId",
        element: <ProductDescriptionPage />,
        loader: clearSummaryDataLoader 
      },
  
      {
        path: "/:categoryName/:productId/design-upload",
        element: <DesignUploadPage />
      },
      {
        path: "/:cartProductId/uploads/:categoryId/:productId",
        element: <EditUploadPage/>
      },
      {
        path: "/:categoryName/:productId/product-summary",
        element: <ProductSummaryPage />
      },
      {
        path: "/:cartProductId/cart-product-summary/:categoryId/:productId",
        element: <CartProductSummary/>
      },
      {
        path: "/orders",
        element: <OrdersPage />
      },
      {
        path: "/my-account",
        element: <AccountPage />
      },
      {
        path: "/cart",
        element: <CartPage />,
        loader: clearSummaryDataLoader 
      },
      {
        path: "/account-settings",
        element: <AccountSettings />
      },
      {
        path: "/address-book",
        element: <AddressBook />
      },
      {
         path: "/checkout",
         element: <CheckoutPage/>
      },
      {
        path: "/wishlist",
        element: <WishlistPage/>
     },
      {
        path: "/my-addresses",
        element: <AddAddress />
      }, 
      {
        path: "/:categoryName/:productId/customize",
        element: <CustomizingPage />
      },    
      {
        path: "/:cartProductId/customize/:categoryId/:productId",
        element: <CartCustomizingPage />
      },     
      {
        path: "/edit-address/:addressId",
        element: <EditAddress/>
      },
      // {
      //   path: "/admin/category-form",
      //   element: <CategoryForm/>
      // },
      // {
      //   path: "/admin/product-form",
      //   element: <ProductForm/>
      // },
      // {
      //   path: "/admin/product-parameters-form",
      //   element: <ProductParametersForm/>
      // },
      // {
      //   path: "/admin/nav-bar-form",
      //   element: <NavBarForm/>
      // },
      // {
      //   path: "/admin/store-address",
      //   element: <StoreAddressForm/>
      // }
    ]
  }
]);

function App() {
  return (
    <SummaryProvider>
      <CartProvider>
        <RouterProvider router={router} />
      </CartProvider>
    </SummaryProvider>
  );
}

export default App;
