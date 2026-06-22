import React, { useState } from 'react';
import { Folder, File, ChevronDown, ChevronRight, Check } from 'lucide-react';

interface StructureNode {
  name: string;
  type: 'folder' | 'file';
  description: string;
  important?: boolean;
  children?: StructureNode[];
}

export default function ProjectStructureOverview() {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'Frontend Architecture': true,
    'Backend Architecture': true,
    'src': true,
    'Root Configuration': true,
  });

  const toggleFolder = (folderName: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderName]: !prev[folderName]
    }));
  };

  const projectTree: StructureNode[] = [
    {
      name: 'Backend Architecture',
      type: 'folder',
      description: 'Clean MVC and Service-layered architecture for physical calculations',
      children: [
        {
          name: 'server.ts',
          type: 'file',
          important: true,
          description: 'Express entrypoint integrating CORS & loading Vite middleware'
        },
        {
          name: 'routes/',
          type: 'folder',
          description: 'REST Controller routing endpoints mapping api prefixes',
          children: [
            {
              name: 'macroRoutes.ts',
              type: 'file',
              description: 'Declares calculation, recommendation, and system health endpoints'
            }
          ]
        },
        {
          name: 'controllers/',
          type: 'folder',
          description: 'Request orchestrators extraction and payload validations',
          children: [
            {
              name: 'macroController.ts',
              type: 'file',
              description: 'Coordinates Mifflin-St Jeor computations and structures JSON responses'
            }
          ]
        },
        {
          name: 'services/',
          type: 'folder',
          description: 'Reusable pure business logic calculation services',
          children: [
            {
              name: 'macroService.ts',
              type: 'file',
              description: 'Executes body metric formulas and compiles food recommendations'
            }
          ]
        },
        {
          name: 'utils/',
          type: 'folder',
          description: 'General system helper functions and calculations formulas',
          children: [
            {
              name: 'helpers.ts',
              type: 'file',
              description: 'Calculates Mifflin BMR, TDEE, and generates optimal macronutrient splits'
            }
          ]
        }
      ]
    },
    {
      name: 'Frontend Architecture',
      type: 'folder',
      description: 'Modular React structures following strict clean code principles',
      children: [
        {
          name: 'src/',
          type: 'folder',
          description: 'Source code folder directory',
          children: [
            {
              name: 'components/',
              type: 'folder',
              description: 'Atomic presentation widgets (Status indicators, layouts, elements)',
              children: [
                { name: 'StatusIndicator.tsx', type: 'file', description: 'Real-time telemetry and API status widget' },
                { name: 'ProjectStructureOverview.tsx', type: 'file', description: 'Interactive directory visualizer (this view)' }
              ]
            },
            {
              name: 'pages/',
              type: 'folder',
              description: 'High-level layouts integrating the presentation views',
              children: [
                { name: 'MacroDashboard.tsx', type: 'file', description: 'Dual interactive interface coupling the Daily Tracker & Metabolic Rate Sandbox' }
              ]
            },
            {
              name: 'hooks/',
              type: 'folder',
              description: 'Custom React lifecycle hooks and fetch controllers',
              children: [
                { name: 'useServerStatus.ts', type: 'file', description: 'Periodically polls the backend for connection state' }
              ]
            },
            {
              name: 'services/',
              type: 'folder',
              description: 'External API endpoint integrations and HTTP requests',
              children: [
                { name: 'api.ts', type: 'file', description: 'Structured backend endpoints fetch client layer' }
              ]
            },
            {
              name: 'utils/',
              type: 'folder',
              description: 'Frontend formatters, parsers and general clean helper code',
              children: [
                { name: 'formatters.ts', type: 'file', description: 'Standard calorie, percentage, and text cosmetic helpers' }
              ]
            },
            { name: 'App.tsx', type: 'file', description: 'Sub-module router and view shell mount core' },
            { name: 'index.css', type: 'file', description: 'Global design directives compiling utility Tailwind CSS' },
            { name: 'main.tsx', type: 'file', description: 'Primary DOM virtual layout injector' }
          ]
        }
      ]
    },
    {
      name: 'Root Configuration',
      type: 'folder',
      description: 'Core project specifications and automation tool targets',
      children: [
        { name: 'package.json', type: 'file', important: true, description: 'Directs node bundles and details start and compile scripts' },
        { name: 'vite.config.ts', type: 'file', description: 'Vite config resolving client paths and modules' },
        { name: 'tsconfig.json', type: 'file', description: 'Rules mapping TypeScript transpiles' },
        { name: 'metadata.json', type: 'file', description: 'Platform declarations registering frame capability flags' },
        { name: '.env.example', type: 'file', description: 'Template guiding required environmental constants' }
      ]
    }
  ];

  const renderNode = (node: StructureNode, level = 0) => {
    const isFolder = node.type === 'folder';
    const isExpanded = expandedFolders[node.name] ?? false;
    const paddingLeft = level * 16;

    return (
      <div key={node.name} className="flex flex-col">
        {/* Row element */}
        <div 
          onClick={() => isFolder && toggleFolder(node.name)}
          style={{ paddingLeft: `${paddingLeft + 12}px` }}
          className={`flex items-center gap-2.5 py-1.5 pr-4 border-l border-slate-100 hover:bg-slate-50 transition-colors ${
            isFolder ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          {isFolder ? (
            <span className="text-slate-400">
              {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </span>
          ) : (
            <span className="h-3.5 w-3.5 flex items-center justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            </span>
          )}

          {isFolder ? (
            <Folder className={`h-4 w-4 shrink-0 ${isExpanded ? 'text-indigo-500' : 'text-indigo-400/90'}`} />
          ) : (
            <File className={`h-4 w-4 shrink-0 ${node.important ? 'text-amber-500' : 'text-slate-400'}`} />
          )}

          <div className="flex flex-wrap items-baseline gap-2">
            <span className={`text-xs font-mono font-medium ${
              isFolder ? 'text-slate-800' : node.important ? 'text-indigo-600 font-semibold' : 'text-slate-600'
            }`}>
              {node.name}
            </span>
            <span className="text-[11px] text-slate-400">
              — {node.description}
            </span>
          </div>
        </div>

        {/* Children node */}
        {isFolder && isExpanded && node.children && (
          <div className="flex flex-col">
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">Interactive Architecture Blueprint</h3>
          <p className="text-xs text-slate-500">Explore the generated layout folders and files</p>
        </div>
        <div className="flex gap-2 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-indigo-500"></span> Folder
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-slate-400"></span> File
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-100 bg-slate-50/50 py-3 font-sans">
        <div className="min-w-[480px]">
          {projectTree.map(rootNode => renderNode(rootNode))}
        </div>
      </div>

      <div className="mt-4 flex gap-2 items-start text-[11px] text-slate-500 rounded-lg bg-indigo-50/50 p-3 border border-indigo-50">
        <Check className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-indigo-900">Architecture Verified:</span> This multi-tier structure decouples high-level controllers, calculations logic, routing definitions, data models, and component states, allowing you to easily scale up when building true data integrations.
        </div>
      </div>
    </div>
  );
}
