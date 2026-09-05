import React from 'react'

export interface Company {
    name: string
    logo: React.ReactNode
}

/* ==========================================================================
   ROW 1 LOGOS:
   1. Google (Standalone G 4-color emblem)
   2. Microsoft (Standalone 4-color square grid emblem)
   3. Amazon (amazon text + yellow smile arrow underneath)
   4. Meta (Standalone blue infinity loop)
   5. Apple (Standalone black apple with leaf)
   6. Flipkart (Yellow shopping bag with blue 'f')
   7. Razorpay (Blue angled 1 / lightning bolt)
   8. Infosys (Blue Infosys wordmark)
   9. TCS (Colorful tcs logo text)
   10. Wipro (Multi-color dot ring wipro logo)
   ========================================================================== */

export function GoogleLogo({ className = "w-9 h-9" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
        </svg>
    )
}

export function MicrosoftLogo({ className = "w-8 h-8" }: { className?: string }) {
    return (
        <div className={`grid grid-cols-2 gap-1 ${className}`}>
            <div className="bg-[#F25022] w-full h-full rounded-2xs" />
            <div className="bg-[#7FBA00] w-full h-full rounded-2xs" />
            <div className="bg-[#00A4EF] w-full h-full rounded-2xs" />
            <div className="bg-[#FFB900] w-full h-full rounded-2xs" />
        </div>
    )
}

export function AmazonLogo({ className = "h-7" }: { className?: string }) {
    return (
        <div className={`flex flex-col items-center justify-center ${className}`}>
            <span className="font-sans font-black text-base leading-none tracking-tight text-text-primary dark:text-dark-text">
                amazon
            </span>
            <svg className="w-10 h-2.5 text-[#FF9900] -mt-0.5" viewBox="0 0 50 15" fill="currentColor">
                <path d="M3.5 8.5C12.5 14 32 14 46.5 3.5C48 2.5 45.5 0.5 44 1.5C31.5 10.5 14 10.5 5 6C3.5 5 2 7.5 3.5 8.5Z" />
                <path d="M42 0.5L47.5 5L45 11.5C45 11.5 48 7.5 42 0.5Z" />
            </svg>
        </div>
    )
}

export function MetaLogo({ className = "w-10 h-8" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 100 60" fill="currentColor">
            <path d="M25.7 10C14.8 10 6 18.8 6 29.7C6 40.6 14.8 49.4 25.7 49.4C33.6 49.4 40.4 44.8 44 38.1C47.6 44.8 54.4 49.4 62.3 49.4C73.2 49.4 82 40.6 82 29.7C82 18.8 73.2 10 62.3 10C54.4 10 47.6 14.6 44 21.3C40.4 14.6 33.6 10 25.7 10ZM25.7 18C31.8 18 36.8 23 36.8 29.7C36.8 36.4 31.8 41.4 25.7 41.4C19.6 41.4 14.6 36.4 14.6 29.7C14.6 23 19.6 18 25.7 18ZM62.3 18C68.4 18 73.4 23 73.4 29.7C73.4 36.4 68.4 41.4 62.3 41.4C56.2 41.4 51.2 36.4 51.2 29.7C51.2 23 56.2 18 62.3 18Z" fill="#0668E1" />
        </svg>
    )
}

export function AppleLogo({ className = "w-8 h-8" }: { className?: string }) {
    return (
        <svg className={`${className} text-text-primary dark:text-dark-text`} viewBox="0 0 170 170" fill="currentColor">
            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.13-1.9-14.37-6.08-3.38-2.73-7.29-7.46-11.75-14.19-7.98-12.16-14.16-25.74-18.52-40.75-4.37-15.01-6.55-29.35-6.55-43.03 0-16.14 3.99-29.83 11.96-41.09 7.97-11.26 18.23-16.99 30.77-17.2 4.69 0 9.87 1.25 15.54 3.76 5.66 2.51 9.47 3.77 11.41 3.77 1.63 0 5.48-1.26 11.55-3.77 6.07-2.51 11.16-3.66 15.26-3.46 11.71.55 21.32 4.79 28.84 12.72-10.46 6.33-15.59 15.2-15.39 26.61.2 9.05 3.65 16.71 10.36 22.98 6.7 6.27 14.77 9.82 24.2 10.65-2.29 6.75-5.24 13.62-8.86 20.61zM119.22 31.81c0-6.95 2.56-13.65 7.67-20.1 5.12-6.45 11.54-10.4 19.26-11.84.44 2.18.66 4.14.66 5.88 0 7.07-2.58 13.91-7.75 20.52-5.17 6.61-11.69 10.46-19.57 11.55-.11-.98-.27-3.01-.27-6.01z" />
        </svg>
    )
}

export function FlipkartLogo({ className = "w-8 h-8" }: { className?: string }) {
    return (
        <div className={`w-8 h-8 rounded-lg bg-[#FFE11B] border-2 border-[#2874F0] flex items-center justify-center relative shadow-xs ${className}`}>
            <span className="font-black text-lg text-[#2874F0] italic font-sans leading-none -mt-0.5">f</span>
        </div>
    )
}

export function RazorpayLogo({ className = "h-8" }: { className?: string }) {
    return (
        <svg className="w-8 h-8 text-[#0C66E4]" viewBox="0 0 24 28" fill="none">
            <path d="M16.5 0L4 16H11.5L7.5 28L20 12H12.5L16.5 0Z" fill="#0C66E4" />
            <path d="M12.5 12H20L7.5 28L11.5 16H4L16.5 0" fill="#3395FF" opacity="0.85" />
        </svg>
    )
}

export function InfosysLogo({ className = "h-6" }: { className?: string }) {
    return (
        <span className="font-sans font-bold text-xl tracking-tight text-[#007CC3]">
            Infosys
        </span>
    )
}

export function TCSLogo({ className = "h-6" }: { className?: string }) {
    return (
        <div className="flex items-center gap-0.5 font-sans font-black text-2xl tracking-tight leading-none">
            <span className="text-[#FF007F]">t</span>
            <span className="text-[#FF4500]">c</span>
            <span className="text-[#9400D3]">s</span>
        </div>
    )
}

export function WiproLogo({ className = "h-7" }: { className?: string }) {
    return (
        <div className="flex items-center gap-1">
            <div className="relative w-6 h-6 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-[#7F00FF] border-t-[#FF007F] border-r-[#007FFF] border-b-[#00FF7F]" />
                <div className="w-2 h-2 rounded-full bg-[#FF007F]" />
            </div>
            <span className="font-sans font-bold text-xs text-text-primary dark:text-dark-text tracking-wide">
                wipro
            </span>
        </div>
    )
}

/* ==========================================================================
   ROW 2 LOGOS:
   11. IBM (8-stripe blue IBM wordmark)
   12. Accenture (accenture text + purple '>' chevron on top of 't')
   13. Deloitte (Deloitte. text + green dot)
   14. Cognizant (Standalone 3D blue diamond/square emblem)
   15. Capgemini (Standalone 3D blue spade emblem)
   16. HCL (Blue italic HCL wordmark)
   17. Tech Mahindra (Tech Mahindra text in red/black)
   18. LTIMindtree (L&T circle emblem + LTIMindtree text)
   19. Zoho (4 colored box tiles Z O H O + ZOHO text underneath)
   20. Adobe (Standalone red stylized A logo)
   ========================================================================== */

export function IBMLogo({ className = "h-7" }: { className?: string }) {
    return (
        <span className="font-mono font-black text-2xl tracking-widest text-[#052FAD]">
            IBM
        </span>
    )
}

export function AccentureLogo({ className = "h-6" }: { className?: string }) {
    return (
        <div className="flex flex-col items-start leading-none">
            <span className="text-[#A100FF] font-black text-xs font-mono ml-7 -mb-1">&gt;</span>
            <span className="font-sans font-bold text-base tracking-tight text-text-primary dark:text-dark-text">
                accenture
            </span>
        </div>
    )
}

export function DeloitteLogo({ className = "h-6" }: { className?: string }) {
    return (
        <div className="flex items-baseline">
            <span className="font-sans font-extrabold text-lg tracking-tight text-text-primary dark:text-dark-text">
                Deloitte
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#86BC25] ml-0.5 inline-block" />
        </div>
    )
}

export function CognizantLogo({ className = "w-8 h-8" }: { className?: string }) {
    return (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0033A0] to-[#00A3E0] transform rotate-45 flex items-center justify-center shadow-xs">
            <div className="w-3.5 h-3.5 bg-white dark:bg-dark-surface transform rounded-2xs" />
        </div>
    )
}

export function CapgeminiLogo({ className = "w-8 h-8" }: { className?: string }) {
    return (
        <svg className="w-8 h-8 text-[#0070AD]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C9.5 7 5 10 5 14.5C5 17.5 7.5 20 10.5 20C12 20 13.5 19.2 14.5 18C14.5 19.5 13.5 21 12 22H15C13.5 21 12.5 19.5 12.5 18C13.5 19.2 15 20 16.5 20C19.5 20 22 17.5 22 14.5C22 10 17.5 7 15 2H12Z" />
        </svg>
    )
}

export function HCLLogo({ className = "h-6" }: { className?: string }) {
    return (
        <span className="font-sans font-black text-2xl italic tracking-tighter text-[#00519E]">
            HCL
        </span>
    )
}

export function TechMahindraLogo({ className = "h-6" }: { className?: string }) {
    return (
        <div className="flex flex-col text-center leading-tight">
            <span className="font-sans font-bold text-xs text-[#E31837]">Tech</span>
            <span className="font-sans font-bold text-xs text-text-primary dark:text-dark-text -mt-1">Mahindra</span>
        </div>
    )
}

export function LTIMindtreeLogo({ className = "h-7" }: { className?: string }) {
    return (
        <div className="flex items-center gap-1">
            <div className="w-6 h-6 rounded-full border-2 border-[#002D62] flex items-center justify-center font-black text-2xs text-[#002D62] dark:text-white">
                L&T
            </div>
        </div>
    )
}

export function ZohoLogo({ className = "h-7" }: { className?: string }) {
    return (
        <div className="flex flex-col items-center gap-0.5">
            <div className="flex gap-0.5">
                <div className="w-3.5 h-3.5 rounded-2xs bg-[#EA2127] border border-[#EA2127] flex items-center justify-center text-white font-bold text-3xs">Z</div>
                <div className="w-3.5 h-3.5 rounded-2xs bg-[#25A244] border border-[#25A244] flex items-center justify-center text-white font-bold text-3xs">O</div>
                <div className="w-3.5 h-3.5 rounded-2xs bg-[#2081C3] border border-[#2081C3] flex items-center justify-center text-white font-bold text-3xs">H</div>
                <div className="w-3.5 h-3.5 rounded-2xs bg-[#FBB040] border border-[#FBB040] flex items-center justify-center text-white font-bold text-3xs">O</div>
            </div>
            <span className="font-sans font-bold text-3xs tracking-widest text-text-muted">ZOHO</span>
        </div>
    )
}

export function AdobeLogo({ className = "w-8 h-8" }: { className?: string }) {
    return (
        <svg className="w-8 h-8 text-[#FF0000]" viewBox="0 0 30 26" fill="currentColor">
            <polygon points="19,0 30,26 23,26 17.5,13 13,26 0,26" />
            <polygon points="11.5,0 19,0 8,26" />
        </svg>
    )
}

/* ==========================================================================
   ROW 3 LOGOS:
   21. NVIDIA (Standalone green eye/spiral logomark)
   22. Intel (intel wordmark inside blue oval ring)
   23. Samsung (Blue SAMSUNG uppercase wordmark)
   24. Oracle (Red ORACLE uppercase wordmark)
   25. Salesforce (Blue cloud logo)
   26. Cisco (Blue soundwave bars above CISCO text)
   27. SAP (Blue SAP trapezoid/triangle badge logo)
   28. Dell (DELL inside blue circle ring)
   29. PayPal (Double blue P logo)
   30. Tesla (Standalone red Tesla T logomark)
   ========================================================================== */

export function NVIDIALogo({ className = "w-8 h-8" }: { className?: string }) {
    return (
        <div className="w-8 h-8 rounded-lg bg-[#76B900] flex items-center justify-center text-white font-black text-xl shadow-xs">
            n
        </div>
    )
}

export function IntelLogo({ className = "h-7" }: { className?: string }) {
    return (
        <div className="px-2 py-0.5 border-2 border-[#0068B5] rounded-full flex items-center justify-center">
            <span className="font-sans font-extrabold text-sm text-[#0068B5]">
                intel
            </span>
        </div>
    )
}

export function SamsungLogo({ className = "h-6" }: { className?: string }) {
    return (
        <span className="font-sans font-black text-sm tracking-widest text-[#1428A0] uppercase">
            SAMSUNG
        </span>
    )
}

export function OracleLogo({ className = "h-6" }: { className?: string }) {
    return (
        <span className="font-sans font-black text-sm tracking-widest text-[#F80000] uppercase">
            ORACLE
        </span>
    )
}

export function SalesforceLogo({ className = "w-10 h-7" }: { className?: string }) {
    return (
        <svg className="w-10 h-7 text-[#00A1E0]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
        </svg>
    )
}

export function CiscoLogo({ className = "h-7" }: { className?: string }) {
    return (
        <div className="flex flex-col items-center justify-center">
            <div className="flex gap-0.5 mb-0.5">
                <div className="w-0.5 h-2 bg-[#049FD9]" />
                <div className="w-0.5 h-3 bg-[#049FD9]" />
                <div className="w-0.5 h-4 bg-[#049FD9]" />
                <div className="w-0.5 h-3 bg-[#049FD9]" />
                <div className="w-0.5 h-2 bg-[#049FD9]" />
            </div>
            <span className="font-sans font-bold text-3xs text-[#049FD9] tracking-widest leading-none">
                CISCO
            </span>
        </div>
    )
}

export function SAPLogo({ className = "h-7" }: { className?: string }) {
    return (
        <div className="px-3 py-1 bg-[#008FD3] rounded-xs text-white font-sans font-black text-sm tracking-wider flex items-center justify-center shadow-xs">
            SAP
        </div>
    )
}

export function DellLogo({ className = "w-7 h-7" }: { className?: string }) {
    return (
        <div className="w-7 h-7 rounded-full border-2 border-[#007DB8] flex items-center justify-center">
            <span className="font-sans font-black text-3xs text-[#007DB8]">
                DELL
            </span>
        </div>
    )
}

export function PayPalLogo({ className = "h-7" }: { className?: string }) {
    return (
        <div className="flex items-center gap-0.5 font-sans font-black text-xl italic leading-none">
            <span className="text-[#003087]">P</span>
            <span className="text-[#0079C1] -ml-1">P</span>
        </div>
    )
}

export function TeslaLogo({ className = "w-8 h-8" }: { className?: string }) {
    return (
        <svg className="w-8 h-8 text-[#E82127]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4.5C8 4.5 5 5.5 3 7L4 9C5.5 7.8 8 7 12 7C16 7 18.5 7.8 20 9L21 7C19 5.5 16 4.5 12 4.5ZM10.5 10H13.5V20H10.5V10Z" />
        </svg>
    )
}

export const ALL_COMPANIES: Company[] = [
    // Row 1
    { name: 'Google', logo: <GoogleLogo /> },
    { name: 'Microsoft', logo: <MicrosoftLogo /> },
    { name: 'Amazon', logo: <AmazonLogo /> },
    { name: 'Meta', logo: <MetaLogo /> },
    { name: 'Apple', logo: <AppleLogo /> },
    { name: 'Flipkart', logo: <FlipkartLogo /> },
    { name: 'Razorpay', logo: <RazorpayLogo /> },
    { name: 'Infosys', logo: <InfosysLogo /> },
    { name: 'Tata Consultancy Services', logo: <TCSLogo /> },
    { name: 'Wipro', logo: <WiproLogo /> },

    // Row 2
    { name: 'IBM', logo: <IBMLogo /> },
    { name: 'Accenture', logo: <AccentureLogo /> },
    { name: 'Deloitte', logo: <DeloitteLogo /> },
    { name: 'Cognizant', logo: <CognizantLogo /> },
    { name: 'Capgemini', logo: <CapgeminiLogo /> },
    { name: 'HCL', logo: <HCLLogo /> },
    { name: 'Tech Mahindra', logo: <TechMahindraLogo /> },
    { name: 'LTIMindtree', logo: <LTIMindtreeLogo /> },
    { name: 'Zoho', logo: <ZohoLogo /> },
    { name: 'Adobe', logo: <AdobeLogo /> },

    // Row 3
    { name: 'NVIDIA', logo: <NVIDIALogo /> },
    { name: 'Intel', logo: <IntelLogo /> },
    { name: 'Samsung', logo: <SamsungLogo /> },
    { name: 'Oracle', logo: <OracleLogo /> },
    { name: 'Salesforce', logo: <SalesforceLogo /> },
    { name: 'Cisco', logo: <CiscoLogo /> },
    { name: 'SAP', logo: <SAPLogo /> },
    { name: 'Dell', logo: <DellLogo /> },
    { name: 'PayPal', logo: <PayPalLogo /> },
    { name: 'Tesla', logo: <TeslaLogo /> },
]
