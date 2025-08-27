import React, { useContext, useState } from 'react';
import { MoreHorizontal, UserPlus, Edit2, Trash2 } from 'react-feather'
import CardAdd from './CardAdd';
import { BoardContext } from '../context/BoardContext';
import { DragDropContext, Draggable, Droppable} from 'react-beautiful-dnd';
import AddList from './AddList';
import Utils from '../utils/Utils';

const Main = ({ currentUser }) => {
    const {allboard,setAllBoard} = useContext(BoardContext);
    const bdata = allboard.boards[allboard.active];

    // State for editing card
    const [editingCard, setEditingCard] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDeadline, setEditDeadline] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editAssigned, setEditAssigned] = useState('');

    function onDragEnd(res){
        if(!res.destination){
            console.log("No Destination");
            return;
        }
        const newList = [...bdata.list];
        const s_id = parseInt(res.source.droppableId);
        const d_id = parseInt(res.destination.droppableId);
        const [removed] = newList[s_id - 1].items.splice(res.source.index,1);
        newList[d_id - 1].items.splice(res.destination.index,0,removed);

        let board_ = {...allboard};
        board_.boards[board_.active].list = newList;
        setAllBoard(board_);
    }

    const cardData = (title, ind, deadline, description, assignedTo) => {
        let newList = [...bdata.list];
        newList[ind].items.push({
            id: Utils.makeid(5),
            title,
            deadline,
            description,
            assignedTo,
            owner: currentUser // set owner when creating card
        });
        let board_ = {...allboard};
        board_.boards[board_.active].list = newList;
        setAllBoard(board_);
    };

    const listData = (e)=>{
        let newList = [...bdata.list];
        newList.push(
            {id:newList.length + 1 + '',title:e,items:[]}
        );

        let board_ = {...allboard};
        board_.boards[board_.active].list = newList;
        setAllBoard(board_);
    };

    const deleteCard = (listIdx, cardIdx) => {
        let newList = [...bdata.list];
        newList[listIdx].items.splice(cardIdx, 1);
        let board_ = {...allboard};
        board_.boards[board_.active].list = newList;
        setAllBoard(board_);
    };

    const startEditCard = (listIdx, cardIdx, card) => {
        // Only owner can edit
        if (card.owner && card.owner !== currentUser) return;
        setEditingCard({ listIdx, cardIdx });
        setEditTitle(card.title);
        setEditDeadline(card.deadline || '');
        setEditDescription(card.description || '');
        setEditAssigned(card.assignedTo || '');
    };

    const saveEditCard = () => {
        if (editingCard) {
            let newList = [...bdata.list];
            let card = newList[editingCard.listIdx].items[editingCard.cardIdx];
            // Only owner can edit
            if (card.owner && card.owner !== currentUser) return;
            card.title = editTitle;
            card.deadline = editDeadline;
            card.description = editDescription;
            card.assignedTo = editAssigned;
            let board_ = {...allboard};
            board_.boards[board_.active].list = newList;
            setAllBoard(board_);
            setEditingCard(null);
        }
    };

    const cancelEditCard = () => {
        setEditingCard(null);
    };

    return (
        <div className='flex flex-col w-full' style={{backgroundColor:`${bdata.bgcolor}`}}>
            <div className='p-3 bg-black flex justify-between w-full bg-opacity-50'>
                <h2 className='text-lg'>{bdata.name}</h2>
                <div className='flex items-center justify-center'>
                    <button className='bg-gray-200 h-8 text-gray-800 px-2 py-1 mr-2 rounded flex justify-center items-center'>
                        <UserPlus size={16} className='mr-2'></UserPlus>
                    Share</button>
                    <button className='hover:bg-gray-500 px-2 py-1 h-8 rounded'><MoreHorizontal size={16}></MoreHorizontal></button>
                </div>
            </div>
            <div className='flex flex-col w-full flex-grow relative'>
                <div className='absolute mb-1 pb-2 left-0 right-0 top-0 bottom-0 p-3 flex overflow-x-scroll overflow-y-hidden'>
                <DragDropContext onDragEnd={onDragEnd}>
                {bdata.list && bdata.list.map((x,ind)=>{
                   return <div key={ind} className='mr-3 w-60 h-fit rounded-md p-2 bg-black flex-shrink-0'>
                    <div className="list-body">
                        <div className='flex justify-between p-1'>
                            <span>{x.title}</span>
                            <button className='hover:bg-gray-500 p-1 rounded-sm'><MoreHorizontal size={16}></MoreHorizontal></button>
                        </div>
                        <Droppable droppableId={x.id}>
                        {(provided, snapshot) => (
                            <div className='py-1'
                            ref={provided.innerRef}
                            style={{ backgroundColor: snapshot.isDraggingOver ? '#222' : 'transparent' }}
                            {...provided.droppableProps}
                            >
                            {x.items && x.items.map((item,index)=>{
                            // Card edit mode
                            if (editingCard && editingCard.listIdx === ind && editingCard.cardIdx === index) {
                                return (
                                    <div key={item.id} className="item flex flex-col bg-zinc-700 p-2 rounded-md border-2 border-zinc-900 mb-2">
                                        <input
                                            className="mb-2 p-1 rounded"
                                            value={editTitle}
                                            onChange={e => setEditTitle(e.target.value)}
                                            placeholder="Task Title"
                                        />
                                        <input
                                            className="mb-2 p-1 rounded"
                                            type="date"
                                            value={editDeadline}
                                            onChange={e => setEditDeadline(e.target.value)}
                                            placeholder="Deadline"
                                        />
                                        <textarea
                                            className="mb-2 p-1 rounded"
                                            value={editDescription}
                                            onChange={e => setEditDescription(e.target.value)}
                                            placeholder="Description"
                                        />
                                        <input
                                            className="mb-2 p-1 rounded"
                                            value={editAssigned}
                                            onChange={e => setEditAssigned(e.target.value)}
                                            placeholder="Assigned to (@username)"
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button className="bg-green-600 px-2 py-1 rounded text-white" onClick={saveEditCard}>Save</button>
                                            <button className="bg-gray-400 px-2 py-1 rounded text-white" onClick={cancelEditCard}>Cancel</button>
                                        </div>
                                    </div>
                                );
                            }
                            return <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <div className="item flex flex-col bg-zinc-700 p-2 cursor-pointer rounded-md border-2 border-zinc-900 hover:border-gray-500 mb-2">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold">{item.title}</span>
                                        <span className='flex justify-start items-start gap-1'>
                                            {/* Only owner can see edit/delete */}
                                            {(!item.owner || item.owner === currentUser) && (
                                                <>
                                                    <button className='hover:bg-gray-600 p-1 rounded-sm' onClick={() => startEditCard(ind, index, item)}><Edit2 size={16}></Edit2></button>
                                                    <button className='hover:bg-red-600 p-1 rounded-sm' onClick={() => deleteCard(ind, index)}><Trash2 size={16}></Trash2></button>
                                                </>
                                            )}
                                        </span>
                                    </div>
                                    {/* Show deadline below title, highlighted */}
                                    {item.deadline && (
                                        <div className="text-xs text-yellow-300 mt-1 font-semibold">
                                            Deadline: {item.deadline}
                                        </div>
                                    )}
                                    {item.description && <div className="text-xs text-gray-300 mt-1">Desc: {item.description}</div>}
                                    {item.assignedTo && <div className="text-xs text-gray-300 mt-1">Assigned: {item.assignedTo}</div>}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        })}

                            {provided.placeholder}
                            </div>
                        )}
                        </Droppable>
                        {/* CardAdd updated to accept deadline, description, assignedTo */}
                        <CardAdd getcard={(title, deadline, description, assignedTo) => cardData(title, ind, deadline, description, assignedTo)}></CardAdd>
                    </div>
                </div>
                })
                }
                </DragDropContext>

                <AddList getlist={(e)=>listData(e)}></AddList>
                </div>
            </div>
        </div>
    );
}

export default Main;
