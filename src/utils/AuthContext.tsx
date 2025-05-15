import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged } from "firebase/auth";
import firebase from "firebase/compat/app";
import React, {
  createContext,
  FC,
  useContext,
  useEffect,
  useState,
} from "react";
import { auth } from "../services/firebase";

type Props = { children: any };
type AuthType = {
  login?: () => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
};

const AuthContext = createContext<AuthType>({
  isAuthenticated: false,
  loading: true,
  login: () => {},
  logout: () => {},
});

export const AuthProvider: FC<Props> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
const unsubscribe = onAuthStateChanged(auth, async (user: firebase.User | null) => {
      if (user) {
        const token = await user.getIdToken();
        await AsyncStorage.setItem("token", token);
        setIsAuthenticated(true);
      } else {
        await AsyncStorage.removeItem("token");
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = () => setIsAuthenticated(true);
  const logout = () => {
    setIsAuthenticated(false);
    AsyncStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
