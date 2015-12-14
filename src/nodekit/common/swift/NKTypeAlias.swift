//
//  typealias.swift
//  nodekit
//
//  Created by Guy on 12/13/15.
//  Copyright © 2015 limerun. All rights reserved.
//

import Foundation

typealias NKNodeCallBack = (error: AnyObject, value: AnyObject) -> Void
typealias NKClosure = () -> Void
typealias NKStringViewer = (msg: String, title: String) -> Void
typealias NKUrlNavigator = (uri: String, title: String) -> Void
typealias NKResizer = (width: Int, height: Int) -> Void
typealias NKNodeEventEmit = (event: String, args: [AnyObject]) -> Void