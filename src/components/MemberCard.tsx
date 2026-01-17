'use client'

import React from 'react'
import Barcode from './Barcode'

interface MemberCardProps {
    storeInfo: {
        name: string
        address: string
        phone: string
    }
    member: {
        name: string
        member_code: string
        phone: string
        join_date: string
    }
}

export function MemberCard({ storeInfo, member }: MemberCardProps) {
    return (
        <div
            id={`member-card-${member.member_code}`}
            className="w-[85.6mm] h-[54mm] bg-gradient-to-br from-primary to-blue-800 text-white p-4 rounded-2xl shadow-xl flex flex-col justify-between overflow-hidden relative font-sans print:shadow-none print:m-0"
            style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
        >
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/10 rounded-full -ml-16 -mb-16 blur-2xl" />

            {/* Header */}
            <div className="flex justify-between items-start z-10">
                <div className="flex flex-col">
                    <h2 className="text-sm font-black tracking-tighter italic uppercase">{storeInfo.name}</h2>
                    <p className="text-[7px] opacity-70 leading-tight max-w-[50mm]">{storeInfo.address}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg border border-white/20">
                    <p className="text-[8px] font-black tracking-widest uppercase">MEMBER CARD</p>
                </div>
            </div>

            {/* Member Info */}
            <div className="z-10 mt-2">
                <p className="text-[8px] uppercase tracking-widest opacity-60 mb-0.5">Nama Member</p>
                <h3 className="text-sm font-black uppercase truncate tracking-tight">{member.name}</h3>
                <div className="flex gap-4 mt-2">
                    <div>
                        <p className="text-[7px] uppercase tracking-widest opacity-60">No HP</p>
                        <p className="text-[9px] font-bold">{member.phone}</p>
                    </div>
                    <div>
                        <p className="text-[7px] uppercase tracking-widest opacity-60">Join Date</p>
                        <p className="text-[9px] font-bold">{new Date(member.join_date).toLocaleDateString('id-ID')}</p>
                    </div>
                </div>
            </div>

            {/* Barcode Section */}
            <div className="bg-white p-1 rounded-lg self-center mt-2 z-10">
                <Barcode
                    value={member.member_code}
                    height={30}
                    width={1.2}
                    fontSize={10}
                    margin={2}
                    className="max-w-[60mm]"
                />
            </div>

            <p className="absolute bottom-2 right-4 text-[6px] opacity-40 font-mono">{member.member_code}</p>
        </div>
    )
}
