/* eslint-disable @next/next/no-img-element */
'use client';
import { processReceiptGemini } from '@/core';
import { Item, Member, useApiKeyStore, useBillBuddyStore, useMemberStore } from '@/util';
import Cropper from 'cropperjs';
import { useEffect, useRef, useState } from 'react';

enum Pages {
  Home,
  ApiKey,
  Member,
  Bill,
  Result,
}

export default function Home() {
  const [currentPage, setCurrentPages] = useState<Pages>(Pages.Home);
  const [loading, setLoading] = useState(false);
  const apikeyStore = useApiKeyStore();
  const memberStore = useMemberStore();
  const billBuddyStore = useBillBuddyStore();
  const image = useRef<HTMLInputElement>(null);
  const cropRef = useRef<HTMLImageElement>(null);
  const cropper = useRef<Cropper>(null);

  useEffect(() => {
    if (!apikeyStore.apiKey) {
      setCurrentPages(Pages.ApiKey);
    }
  }, [apikeyStore.apiKey]);
  return (
    <div className="flex flex-col justify-center items-center min-h-screen w-screen">
      {currentPage === Pages.Home
        ? (
            <>
              Upload your receipt here
              <input
                type="file"
                id="input"
                ref={image}
                onChange={() => {
                  console.log('got', image.current?.files?.[0]);
                  if (image.current?.files?.[0]) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      if (e.target && cropRef.current) {
                        if (cropper.current) {
                          cropper.current.getCropperCanvas()!.remove();
                          cropper.current = null;
                        }
                        cropRef.current.src = e.target.result as string;
                        cropper.current = new Cropper('#crop');
                        cropper.current.getCropperCanvas()!.style.minWidth = '500px';
                        cropper.current.getCropperCanvas()!.style.minHeight = '500px';
                        cropper.current.getCropperSelection()!.initialCoverage = 1;
                      }
                    };
                    reader.readAsDataURL(image.current.files[0]);
                  }
                }}
              />
              <img alt="" ref={cropRef} id="crop" />
              <button onClick={() => {
                if (cropper.current) {
                  cropper.current.getCropperSelection()!.$toCanvas().then((e) => {
                    e.toBlob((e) => {
                      if (e) {
                        processReceiptGemini(e, apikeyStore.apiKey, setLoading, billBuddyStore.addItem);
                        setCurrentPages(Pages.Member);
                        if (cropper.current) {
                          cropper.current.getCropperCanvas()!.remove();
                          cropper.current = null;
                        }
                      }
                    });
                  });
                }
                setCurrentPages(Pages.Member);
              }}
              >
                Upload
              </button>
            </>
          )
        : currentPage === Pages.ApiKey
          ? (
              <>
                Please input your gemini apikey
                <input
                  type="password"
                  onChange={(e) => {
                    apikeyStore.setApiKey(e.target.value);
                  }}
                />
                <button onClick={() => setCurrentPages(Pages.Home)}>Done</button>
              </>
            )
          : currentPage === Pages.Member
            ? (
                <>
                  <h1 className="text-2xl">
                    Member
                    {' '}
                    <span onClick={() => memberStore.addMember()}>+</span>
                  </h1>
                  {memberStore.members.map(member => (
                    <div key={member.id} className="flex gap-2 mb-2">
                      <input type="color" className="rounded-full h-8 w-8" value={member.color} onChange={e => memberStore.editMemberColor(member.id, e.target.value)} />
                      <input type="text" value={member.name} onChange={e => memberStore.editMemberName(member.id, e.target.value)} />
                      <button onClick={() => memberStore.removeMember(member.id)}>Delete</button>
                    </div>
                  ))}
                  <button onClick={() => setCurrentPages(Pages.Bill)}>Continue</button>
                </>
              )
            : currentPage === Pages.Bill
              ? loading
                ? (
                    <>
                      <h1>Processing...</h1>
                      <h1>Please Wait</h1>
                    </>
                  )
                : (
                    <>
                      <h1 className="text-2xl">Bill</h1>
                      {billBuddyStore.items.map(item => (
                        <div key={item.id} className="flex gap-2 mb-2">
                          <input type="number" value={item.count} onChange={e => billBuddyStore.editItemCount(item.id, Number(e.target.value))} />
                          <input type="text" value={item.name} onChange={e => billBuddyStore.editItemName(item.id, e.target.value)} />
                          <input type="number" value={item.price} onChange={e => billBuddyStore.editItemPrice(item.id, Number(e.target.value))} />
                          <div className="flex">
                            {memberStore.members.map(member => (
                              <div className="rounded-full h-8 w-8 cursor-pointer" style={{ backgroundColor: member.color }} key={member.id} onClick={() => billBuddyStore.toggleItemMember(item.id, member.id)} />
                            ))}
                          </div>
                          <button onClick={() => billBuddyStore.removeItem(item.id)}>Delete</button>
                        </div>
                      ))}
                      <button onClick={() => setCurrentPages(Pages.Result)}>Finish</button>
                    </>
                  )
              : currentPage === Pages.Result
                ? (
                    <>
                      {calculateResult(billBuddyStore.items, memberStore.members).map(result => (
                        <div key={result.id}>
                          <p>
                            <input type="color" className="rounded-full h-8 w-8" value={result.color} disabled />
                            {result.name}
                          </p>
                          {result.items.map(item => (
                            <div key={item.id}>
                              {item.name}
                              {' '}
                              -
                              {item.price / item.split}
                            </div>
                          ))}
                        </div>
                      ))}
                    </>
                  )
                : (
                    <h1 className="text-5xl">Not Found :(</h1>
                  )}
    </div>
  );
}

type ItemPerMember = Member & {
  items: (Item & { split: number })[]
};

const calculateResult = (items: Item[], members: Member[]) => {
  const itemPerMember: ItemPerMember[] = [];
  members.forEach((member) => {
    itemPerMember.push({
      ...member,
      items: [],
    });
  });
  console.log('wut', items);
  items.forEach((item) => {
    const splitCount = item.members.length;
    item.members.forEach((id) => {
      const idx = itemPerMember.findIndex(v => v.id == id);
      console.log('wtf', idx, item);
      itemPerMember[idx].items.push({
        ...item,
        split: splitCount,
      });
    });
  });
  console.log(itemPerMember);
  return itemPerMember;
};
