import React from 'react';

export const CodeBattleLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="200" height="50" viewBox="0 0 200 50" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <style>
            {`
            .codebattle-c { fill: url(#grad1); animation: glow 2s ease-in-out infinite alternate; }
            .codebattle-b { fill: url(#grad2); animation: glow 2s ease-in-out infinite alternate; animation-delay: 0.5s; }
            @keyframes glow {
                from { filter: drop-shadow(0 0 2px #fff) drop-shadow(0 0 5px #0ff) drop-shadow(0 0 10px #0ff); }
                to { filter: drop-shadow(0 0 5px #fff) drop-shadow(0 0 10px #f0f) drop-shadow(0 0 15px #f0f); }
            }
            `}
        </style>
        <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor: '#00FFFF'}} />
                <stop offset="100%" style={{stopColor: '#00BFFF'}} />
            </linearGradient>
            <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor: '#FF00FF'}} />
                <stop offset="100%" style={{stopColor: '#FF69B4'}} />
            </linearGradient>
        </defs>
        <text x="5" y="40" fontFamily="'Russo One', sans-serif" fontSize="40" className="codebattle-c">Code</text>
        <text x="100" y="40" fontFamily="'Russo One', sans-serif" fontSize="40" className="codebattle-b">Battle</text>
    </svg>
);

export const Volume2Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" > <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /> <path d="M15.54 8.46a5 5 0 0 1 0 7.07" /> <path d="M19.07 4.93a10 10 0 0 1 0 14.14" /> </svg> );
export const VolumeXIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" > <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /> <line x1="23" x2="17" y1="9" y2="15" /> <line x1="17" x2="23" y1="9" y2="15" /> </svg> );
export const CoinIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="gold" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" > <circle cx="12" cy="12" r="8"></circle> <path d="M12 16v-4"></path> <path d="M12 8h.01"></path> <path d="M15 13.5c-1-1-2-1.5-3-1.5s-2 .5-3 1.5"></path> </svg> );
export const PotionIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" > <path d="M12 5C10.8954 5 10 5.89543 10 7V10H14V7C14 5.89543 13.1046 5 12 5Z" /> <path d="M10 10C8.34315 10 7 11.3431 7 13C7 15.2091 8.79086 17 11 17H13C15.2091 17 17 15.2091 17 13C17 11.3431 15.6569 10 14 10H10Z" /> <path d="M12 17V19" /> <path d="M9 19H15" /> </svg> );

// Intent Icons
export const SwordIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M21.5 3.5-3.5 21.5"/> <path d="m16 8 3 3"/> <path d="M17.5 12.5 10 20"/> <path d="M5 19 2 22"/> <path d="m18 11 1 1"/> <path d="M21 3 12 12"/> </svg> );
export const HeavyAttackIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="m14.5 2.5-3 3"/> <path d="m20 8-3-3"/> <path d="M11 13 3 21"/> <path d="M21 3 3 21"/> <path d="m15 12-3.5 3.5"/> </svg> );
export const ShieldIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/> </svg> );
export const DebuffIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M12 2v4"/> <path d="M12 18v4"/> <path d="m4.93 4.93 2.83 2.83"/> <path d="m16.24 16.24 2.83 2.83"/> <path d="M2 12h4"/> <path d="M18 12h4"/> <path d="m4.93 19.07 2.83-2.83"/> <path d="m16.24 7.76 2.83-2.83"/> </svg> );
