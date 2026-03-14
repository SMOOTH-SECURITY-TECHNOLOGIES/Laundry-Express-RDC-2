import { useAuth } from './AuthContext';
import { useData } from './DataContext';
import { useLanguageContext } from './LanguageContext';
import { useNavigation } from './NavigationContext';
import { useNotification } from './NotificationContext';
import { useOrder } from './OrderContext';
import { useTheme } from './ThemeContext';

export const useAppContext = () => {
  const auth = useAuth();
  const data = useData();
  const language = useLanguageContext();
  const navigation = useNavigation();
  const notification = useNotification();
  const order = useOrder();
  const theme = useTheme();

  return {
    ...auth,
    ...data,
    ...navigation,
    ...notification,
    ...order,
    ...theme,
    ...language, // Moved to the end to ensure `t` and other language properties are not overridden
    // Resolve name collision for isLoading.
    // It is used as a generic loading flag in some places.
    isLoading: auth.isLoading || data.isLoading || order.isLoading || language.isLoading,
  };
};