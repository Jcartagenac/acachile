import { ReactNode } from 'react';
import { PasswordProtection } from './PasswordProtection';

interface ShopPasswordProtectionProps {
  children: ReactNode;
}

const SHOP_PASSWORD = 'Aca2025';
const SHOP_ACCESS_KEY = 'aca_shop_access';

export const ShopPasswordProtection: React.FC<ShopPasswordProtectionProps> = ({ children }) => (
  <PasswordProtection
    password={SHOP_PASSWORD}
    storageKey={SHOP_ACCESS_KEY}
    title="Tienda Exclusiva"
    description="Ingresa la clave de acceso para continuar"
    buttonLabel="Ingresar a la Tienda"
  >
    {children}
  </PasswordProtection>
);
