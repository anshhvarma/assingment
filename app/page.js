'use client'
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Undo2, Redo2 } from 'lucide-react';

const CanvasTextEditor = () => {
  const [textElements, setTextElements] = useState([]);
  const [history, setHistory] = useState({ past: [], future: [] });

  const canvasRef = useRef(null);
  const isDraggingRef = useRef(false);
  const currentElementRef = useRef(null);
  const offsetXRef = useRef(0);
  const offsetYRef = useRef(0);

  const [currentText, setCurrentText] = useState('');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState(16);
  const [fontStyle, setFontStyle] = useState('normal');
  const [fontWeight, setFontWeight] = useState('normal');

  const fontFamilies = [
    'Arial', 
    'Verdana', 
    'Helvetica', 
    'Times New Roman', 
    'Courier New', 
    'Georgia', 
    'Palatino Linotype'
  ];

  const redrawCanvas = (ctx, elements) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    elements.forEach((element) => {
      ctx.font = `${element.fontStyle} ${element.fontWeight} ${element.fontSize}px ${element.fontFamily}`;
      ctx.fillText(element.text, element.x, element.y);
    });
  };

  const updateHistoryAndElements = (newElements) => {
    setHistory(prev => ({
      past: [...prev.past, textElements],
      future: [] // Clear future when a new action is performed
    }));
    setTextElements(newElements);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    redrawCanvas(ctx, newElements);
  };

  const addTextToCanvas = () => {
    if (!currentText.trim()) return; 

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const x = canvas.width / 2;
    const y = canvas.height / 2;

    const newTextElement = {
      id: Date.now(),
      text: currentText,
      x, 
      y, 
      fontFamily,
      fontSize,
      fontStyle,
      fontWeight
    };

    const updatedElements = [...textElements, newTextElement];
    updateHistoryAndElements(updatedElements);
    setCurrentText('');
  };

  const handleUndo = () => {
    if (history.past.length === 0) return;

    const newPast = [...history.past];
    const previousState = newPast.pop();

    setHistory({
      past: newPast,
      future: [textElements, ...history.future]
    });

    setTextElements(previousState);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    redrawCanvas(ctx, previousState);
  };

  const handleRedo = () => {
    if (history.future.length === 0) return;

    const newFuture = [...history.future];
    const nextState = newFuture.shift();

    setHistory({
      past: [...history.past, textElements],
      future: newFuture
    });

    setTextElements(nextState);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    redrawCanvas(ctx, nextState);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const handleMouseDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const clickedElement = textElements.find((el) => {
        ctx.font = `${el.fontStyle} ${el.fontWeight} ${el.fontSize}px ${el.fontFamily}`;
        const metrics = ctx.measureText(el.text);
        return (
          mouseX >= el.x &&
          mouseX <= el.x + metrics.width &&
          mouseY <= el.y &&
          mouseY >= el.y - el.fontSize
        );
      });

      if (clickedElement) {
        isDraggingRef.current = true;
        currentElementRef.current = clickedElement;
        offsetXRef.current = mouseX - clickedElement.x;
        offsetYRef.current = mouseY - clickedElement.y;
      }
    };

    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const updatedElements = textElements.map((el) =>
        el.id === currentElementRef.current.id
          ? { ...el, x: mouseX - offsetXRef.current, y: mouseY + el.fontSize - offsetYRef.current }
          : el
      );

      setTextElements(updatedElements);
      redrawCanvas(ctx, updatedElements);
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        updateHistoryAndElements(textElements);
      }
      isDraggingRef.current = false;
      currentElementRef.current = null;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseout', handleMouseUp);

    redrawCanvas(ctx, textElements);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseout', handleMouseUp);
    };
  }, [textElements]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-4 flex space-x-2">
        <Input
          value={currentText}
          onChange={(e) => setCurrentText(e.target.value)}
          placeholder="Enter text"
          className="flex-grow"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              addTextToCanvas();
            }
          }}
        />
        <Button onClick={addTextToCanvas}>Add Text</Button>
        <Button 
          variant="outline" 
          onClick={handleUndo} 
          disabled={history.past.length === 0}
        >
          <Undo2 className="mr-2" /> Undo
        </Button>
        <Button 
          variant="outline" 
          onClick={handleRedo} 
          disabled={history.future.length === 0}
        >
          <Redo2 className="mr-2" /> Redo
        </Button>
      </div>

      <div className="mb-4 flex space-x-2">
        <Select value={fontFamily} onValueChange={setFontFamily}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Font" />
          </SelectTrigger>
          <SelectContent>
            {fontFamilies.map((font) => (
              <SelectItem key={font} value={font}>
                {font}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="number"
          value={fontSize}
          onChange={(e) => setFontSize(parseInt(e.target.value))}
          min="8"
          max="72"
          className="w-24"
        />

        <Select value={fontStyle} onValueChange={setFontStyle}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Style" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="italic">Italic</SelectItem>
          </SelectContent>
        </Select>

        <Select value={fontWeight} onValueChange={setFontWeight}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Weight" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="bold">Bold</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        className="border-2 border-gray-300 bg-white cursor-move"
      />
    </div>
  );
};

export default CanvasTextEditor;