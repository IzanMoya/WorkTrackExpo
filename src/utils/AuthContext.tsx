// context/AuthContext.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, FC, useContext, useState } from "react";

type Props = { children: any };
type AuthType = {
  login?: () => void;
  logout?: () => void;
  isAuthenticated: boolean;
};
const AuthContext = createContext<AuthType>({ isAuthenticated: false });

export const AuthProvider: FC<Props> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  AsyncStorage.getItem("usuarioId").then((res) => {
    if (res !== null && res !== undefined) setIsAuthenticated(true);
    
  });

  const login = () => setIsAuthenticated(true);
  const logout = () => setIsAuthenticated(false);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
