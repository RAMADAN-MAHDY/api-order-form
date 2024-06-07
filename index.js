'use client';
import { useState, useEffect, useMemo } from 'react';
import { AiFillFrown, AiFillSmile } from "react-icons/ai";
import Notec from '@/app/componant/notec';
import io from 'socket.io-client';
import Link from 'next/link';

const Admin = () => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchInput, setSearchInput] = useState('');
    const [newCondition, setNewCondition] = useState([]);
    const [newConditionLength, setNewConditionLength] = useState(0);
    const [notices, setNotices] = useState(false);

    useEffect(() => {
        const savedConditions = JSON.parse(localStorage.getItem('newCondition')) || [];
        const savedLength = parseInt(localStorage.getItem('newConditionLength'), 10) || 0;
        setNewCondition(savedConditions);
        setNewConditionLength(savedLength);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('https://api-order-form.onrender.com/user');
                const responseData = await response.json();
                setData(responseData);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const socket = io('https://api-order-form.onrender.com');
        socket.on('new-condition', (data) => {
            setNewCondition(prevConditions => {
                const updatedConditions = [...prevConditions, data];
                localStorage.setItem('newCondition', JSON.stringify(updatedConditions));
                return updatedConditions;
            });
            setNewConditionLength(prevLength => {
                const updatedLength = prevLength + 1;
                localStorage.setItem('newConditionLength', updatedLength.toString());
                return updatedLength;
            });
        });

        socket.on('unread-notifications', (data) => {
            console.log('Received unseen notifications:', data);
            setNewCondition(prevConditions => {
                const updatedConditions = [...prevConditions, ...data];
                localStorage.setItem('newCondition', JSON.stringify(updatedConditions));
                return updatedConditions;
            });
            setNewConditionLength(prevLength => {
                const updatedLength = prevLength + data.length;
                localStorage.setItem('newConditionLength', updatedLength.toString());
                return updatedLength;
            });
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const handleSearchInputChange = (event) => {
        setSearchInput(event.target.value);
    };

    const filteredData = useMemo(() => {
        if (!data) return [];
        return data.filter((item) =>
            item.code.toString().includes(searchInput) ||
            item.email.toString().includes(searchInput)
        );
    }, [data, searchInput]);

    const handleEmojiClick = () => {
        setNotices(!notices);
        localStorage.removeItem("newConditionLength");
        setNewConditionLength(0);
    };

    return (
        <div dir='rtl'>
            <div className='flex justify-between'>
                <input
                    className='p-3 rounded-3xl m-3 sm:w-[200px] w-[100px] h-[30px] left-0'
                    type="text"
                    placeholder="ابحث بالكود أو الاسم"
                    value={searchInput}
                    onChange={handleSearchInputChange}
                />
                <h1 className='text-[#ffffff] sm:h-[50px] h-[40px] mb-3 sm:text-[24px] p-1 bg-[#c5c5c1] shadow-[0_35px_35px_rgba(3,3,3,1.25)]'> بسم الله الرحمن الرحيم</h1>
                <div className="mb-3 h-[60px] self-center border border-gray-400 rounded-lg p-4 group hover:bg-white bg-gradient-to-br from-red-500 to-blue-500 via-green-500">
                    <span className="h-[60px] bg-clip-text bg-gradient-to-br from-red-500 to-blue-500 via-green-500 text-[#fff] hover:text-white animate-pulse">
                        Royal corner
                    </span>
                </div>
            </div>
            {newConditionLength > 0 ? (
                <div className="relative top-[8px]">
                    <AiFillSmile
                        className='text-[#ddff00] w-[50px] h-[50px] bg-[#000] rounded-full'
                        onClick={handleEmojiClick}
                    />
                    <p className="text-[#ffffff] text-[15px] w-[30px] h-[30px] pt-[0.3rem] pr-[0.75rem] rounded-full bg-[#ff1100] absolute top-[-9px] right-[40px]">
                        {newConditionLength}
                    </p>
                </div>
            ) : (
                <div className="relative top-[8px]">
                    <AiFillFrown
                        className='text-[#ddff00] w-[50px] h-[50px] bg-[#000] rounded-full'
                        onClick={() => setNotices(!notices)}
                    />
                </div>
            )}
            {notices && <Notec lengthpro={newCondition.map(item => item.code)} />}
            {isLoading ? (
                <div className="m-[40%] loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-32 w-32 p-3">
                    <p className='p-3 m-3'>Loading</p>
                </div>
            ) : filteredData.length > 0 ? (
                <div className="overflow-x-auto mr-3 mt-5">
                    <table className="table-auto w-full border-collapse">
                        <thead>
                            <tr className='text-[#32ff46] bg-[#433]'>
                                <th className="border border-gray-800 px-4 py-2">العدد</th>
                                <th className="border border-gray-800 px-4 py-2">الاسم</th>
                                <th className="border border-gray-800 px-4 py-2">الكود</th>
                                <th className="border border-gray-800 px-4 py-2">عرض الطلبات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((dataItem) => (
                                <tr key={dataItem.code}>
                                    <td className="border border-gray-800 px-4 py-2">{} قيد لانشاء</td>
                                    <td className="border border-gray-800 px-4 py-2">{dataItem.email}</td>
                                    <td className="border border-gray-800 px-4 py-2">{dataItem.code}</td>
                                    <td className="border border-gray-800 px-4 py-2">
                                        <Link href={`/adminahmed/${dataItem.code}`}
                                            className='bg-[#236a22] text-[#fff] p-2 rounded-3xl hover:bg-[#4cfa49]'>عرض الطلبات
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p>No data available</p>
            )}
        </div>
    );
};

export default Admin;
