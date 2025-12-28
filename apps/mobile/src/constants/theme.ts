export const COLORS = {
    // Stone Palette
    background: '#fafaf9', // stone-50
    surface: '#ffffff',
    surfaceHighlight: '#f5f5f4', // stone-100

    // Text
    textPrimary: '#1c1917', // stone-900
    textSecondary: '#78716c', // stone-500
    textMuted: '#a8a29e', // stone-400
    textInverse: '#ffffff',

    // Brand / Actions
    primary: '#d97706', // amber-600
    primaryDark: '#b45309', // amber-700
    primaryLight: '#fcd34d', // amber-300

    // States
    success: '#15803d', // green-700
    successBg: '#dcfce7', // green-100
    error: '#b91c1c', // red-700
    errorBg: '#fee2e2', // red-100

    // Borders
    border: '#e7e5e4', // stone-200

    // Instrument / Tooling Palette (New)
    slate: '#1e293b', // slate-800
    slateLight: '#334155', // slate-700
    instrumentBg: '#0f172a', // slate-900
    instrumentSurface: '#1e293b', // slate-800
    instrumentBorder: '#334155', // slate-700
    digitalGreen: '#10b981', // emerald-500
    digitalAmber: '#f59e0b', // amber-500
    digitalRed: '#ef4444', // red-500
};

export const LAYOUT = {
    screenPadding: 20,
    cardGap: 16,
    borderRadius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        pill: 999
    }
};

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
};

export const TYPOGRAPHY = {
    header: {
        fontSize: 24,
        fontWeight: '700' as '700',
        color: COLORS.textPrimary,
    },
    subheader: {
        fontSize: 18,
        fontWeight: '600' as '600',
        color: COLORS.textPrimary,
    },
    body: {
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    caption: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    label: {
        fontSize: 12,
        fontWeight: '700' as '700',
        color: COLORS.textSecondary,
        textTransform: 'uppercase' as 'uppercase',
        letterSpacing: 1,
    }
};

export const SHADOWS = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
    },
};
